import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user's email is verified (optional - can be commented out if not required)
    // if (!user.email_verified) {
    //   throw new UnauthorizedException('Please verify your email');
    // }

    // Check if password was changed after token was issued
    if (user.password_changed_at && payload.iat) {
      const passwordChangedTimestamp = Math.floor(
        user.password_changed_at.getTime() / 1000,
      );
      if (payload.iat < passwordChangedTimestamp) {
        throw new UnauthorizedException(
          'Password was changed. Please login again',
        );
      }
    }

    return user;
  }
}
