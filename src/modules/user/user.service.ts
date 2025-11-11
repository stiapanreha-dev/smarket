import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '@/database/entities/user.entity';
import { Merchant } from '@/database/entities/merchant.entity';
import { RefreshToken } from '@/database/entities/refresh-token.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { EmailService } from '@/common/services/email.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { AuditAction } from '@/database/entities/audit-log.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getProfile(
    userId: string,
    includeMerchant: boolean = true,
  ): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: includeMerchant ? ['merchants'] : [],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toProfileResponse(user, includeMerchant);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    // Check email uniqueness if changing email
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      oldValues.email = user.email;
      newValues.email = updateDto.email;

      // Send notification to both emails
      await this.emailService.sendEmailChangedNotification(
        user.email,
        updateDto.email,
        user.locale,
      );

      user.email = updateDto.email;
      user.email_verified = false; // Require re-verification

      // Generate new verification token
      user.email_verification_token = this.generateToken();
      user.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Send verification email to new address
      await this.emailService.sendVerificationEmail(
        user.email,
        user.email_verification_token,
        user.locale,
      );

      // Log email change
      await this.auditLogService.createLog({
        userId: user.id,
        action: AuditAction.EMAIL_CHANGED,
        description: 'Email address changed',
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      });
    }

    // Check phone uniqueness if changing phone
    if (updateDto.phone && updateDto.phone !== user.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }

      oldValues.phone = user.phone;
      newValues.phone = updateDto.phone;
      user.phone = updateDto.phone;
      user.phone_verified = false; // Require re-verification

      // Log phone change
      await this.auditLogService.createLog({
        userId: user.id,
        action: AuditAction.PHONE_CHANGED,
        description: 'Phone number changed',
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      });
    }

    // Update other fields
    if (updateDto.first_name !== undefined) {
      oldValues.first_name = user.first_name;
      newValues.first_name = updateDto.first_name;
      user.first_name = updateDto.first_name;
    }

    if (updateDto.last_name !== undefined) {
      oldValues.last_name = user.last_name;
      newValues.last_name = updateDto.last_name;
      user.last_name = updateDto.last_name;
    }

    if (updateDto.locale !== undefined) {
      oldValues.locale = user.locale;
      newValues.locale = updateDto.locale;
      user.locale = updateDto.locale;
    }

    if (updateDto.currency !== undefined) {
      oldValues.currency = user.currency;
      newValues.currency = updateDto.currency;
      user.currency = updateDto.currency;
    }

    if (updateDto.avatar_url !== undefined) {
      oldValues.avatar_url = user.avatar_url;
      newValues.avatar_url = updateDto.avatar_url;
      user.avatar_url = updateDto.avatar_url;
    }

    if (updateDto.date_of_birth !== undefined) {
      oldValues.date_of_birth = user.date_of_birth;
      newValues.date_of_birth = updateDto.date_of_birth;
      user.date_of_birth = updateDto.date_of_birth ? new Date(updateDto.date_of_birth) : null;
    }

    if (updateDto.metadata !== undefined) {
      oldValues.metadata = user.metadata;
      newValues.metadata = updateDto.metadata;
      user.metadata = updateDto.metadata;
    }

    await this.userRepository.save(user);

    // Log profile update if not already logged (email/phone)
    if (Object.keys(oldValues).length > 0 && !oldValues.email && !oldValues.phone) {
      await this.auditLogService.createLog({
        userId: user.id,
        action: AuditAction.PROFILE_UPDATED,
        description: 'Profile updated',
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      });
    }

    return this.toProfileResponse(user);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(
      user.password_hash,
      changePasswordDto.current_password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSamePassword = await argon2.verify(user.password_hash, changePasswordDto.new_password);

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(changePasswordDto.new_password, {
      type: argon2.argon2id,
    });

    user.password_hash = hashedPassword;
    user.password_changed_at = new Date();

    await this.userRepository.save(user);

    // Invalidate all refresh tokens for security
    await this.revokeAllUserTokens(userId);

    // Send email notification
    await this.emailService.sendPasswordChangedEmail(user.email, user.locale);

    // Log password change
    await this.auditLogService.createLog({
      userId: user.id,
      action: AuditAction.PASSWORD_CHANGED,
      description: 'Password changed by user',
      ipAddress,
      userAgent,
    });

    return { message: 'Password changed successfully. Please login again.' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    // Always return success to prevent email enumeration
    const successMessage =
      'If an account exists with this email, a password reset link will be sent.';

    if (!user) {
      return { message: successMessage };
    }

    // Generate password reset token
    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;

    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.locale);

    // Log password reset request
    await this.auditLogService.createLog({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      description: 'Password reset requested',
      ipAddress,
      userAgent,
    });

    return { message: successMessage };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: resetPasswordDto.token,
        password_reset_expires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(resetPasswordDto.new_password, {
      type: argon2.argon2id,
    });

    user.password_hash = hashedPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    user.password_changed_at = new Date();

    await this.userRepository.save(user);

    // Invalidate all refresh tokens for security
    await this.revokeAllUserTokens(user.id);

    // Send email notification
    await this.emailService.sendPasswordChangedEmail(user.email, user.locale);

    // Log password reset completion
    await this.auditLogService.createLog({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      description: 'Password reset completed',
      ipAddress,
      userAgent,
    });

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Resend email verification
   */
  async resendVerification(
    resendDto: ResendVerificationDto,
    _ipAddress?: string,
    _userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: resendDto.email },
    });

    // Always return success to prevent email enumeration
    const successMessage =
      'If your email is registered and not verified, a verification link will be sent.';

    if (!user) {
      return { message: successMessage };
    }

    if (user.email_verified) {
      return { message: 'Email is already verified.' };
    }

    // Generate new verification token
    const verificationToken = this.generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.email_verification_token = verificationToken;
    user.email_verification_expires = verificationExpires;

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken, user.locale);

    return { message: successMessage };
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { user_id: userId, revoked: false },
      { revoked: true, revoked_at: new Date() },
    );

    await this.auditLogService.createLog({
      userId,
      action: AuditAction.ALL_SESSIONS_REVOKED,
      description: 'All sessions revoked due to password change',
    });
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Convert User entity to ProfileResponse DTO
   */
  private toProfileResponse(user: User, includeMerchant: boolean = true): UserProfileResponseDto {
    const response: UserProfileResponseDto = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      date_of_birth: user.date_of_birth,
      full_name: user.full_name,
      locale: user.locale,
      currency: user.currency,
      role: user.role,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    if (includeMerchant && user.merchants && user.merchants.length > 0) {
      response.merchants = user.merchants.map((merchant) => ({
        id: merchant.id,
        legal_name: merchant.legal_name,
        display_name: merchant.display_name,
        kyc_status: merchant.kyc_status,
        status: merchant.status,
      }));
    }

    return response;
  }
}
