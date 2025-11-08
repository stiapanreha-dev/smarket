import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '@/database/entities/user.entity';
import { RefreshToken } from '@/database/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenPair, AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(registerDto.password, {
      type: argon2.argon2id,
    });

    // Generate email verification token
    const emailVerificationToken = this.generateToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash: hashedPassword,
      phone: registerDto.phone || null,
      locale: registerDto.locale,
      currency: registerDto.currency,
      email_verification_token: emailVerificationToken,
      email_verification_expires: emailVerificationExpires,
    });

    await this.userRepository.save(user);

    // TODO: Send verification email
    // await this.emailService.sendVerificationEmail(user, emailVerificationToken);

    // Generate tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password_hash, loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Optional: Check if email is verified
    // if (!user.email_verified) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }

    // Update last login
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find refresh token in database
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          token: refreshToken,
          user_id: payload.sub,
          revoked: false,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expires_at < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Check for token reuse (possible token theft)
      if (storedToken.used) {
        // Revoke all tokens for this user
        await this.revokeAllUserTokens(payload.sub);
        throw new UnauthorizedException(
          'Token reuse detected. All sessions have been revoked for security.',
        );
      }

      // Mark token as used
      storedToken.used = true;
      storedToken.revoked = true;
      storedToken.revoked_at = new Date();
      await this.refreshTokenRepository.save(storedToken);

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens (rotation)
      const newTokens = await this.generateTokens(user, userAgent, ipAddress);

      return newTokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (storedToken) {
      storedToken.revoked = true;
      storedToken.revoked_at = new Date();
      await this.refreshTokenRepository.save(storedToken);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: {
        email_verification_token: token,
        email_verification_expires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await this.userRepository.save(user);

    // TODO: Send welcome email
    // await this.emailService.sendWelcomeEmail(user);

    return { message: 'Email verified successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token (15 minutes)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    });

    // Generate refresh token (30 days)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
    });

    // Save refresh token to database
    await this.saveRefreshToken(user.id, refreshToken, userAgent, ipAddress);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(
    userId: string,
    token: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const refreshToken = this.refreshTokenRepository.create({
      token,
      user_id: userId,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true, revoked_at: new Date() },
    );
  }

  /**
   * Generate random token (for email verification, password reset, etc.)
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, email_verification_token, password_reset_token, ...sanitized } = user;
    return sanitized;
  }
}
