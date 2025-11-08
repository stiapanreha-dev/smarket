import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@ApiTags('Users')
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile of the currently authenticated user. Includes merchant info if user is a merchant.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@CurrentUser('sub') userId: string): Promise<UserProfileResponseDto> {
    return this.userService.getProfile(userId, true);
  }

  /**
   * Update user profile
   */
  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Update profile information. Email and phone changes require re-verification. Validates email uniqueness and phone format.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email or phone already in use',
  })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<UserProfileResponseDto> {
    const userAgent = req.headers['user-agent'];
    return this.userService.updateProfile(userId, updateProfileDto, ip, userAgent);
  }

  /**
   * Change password
   */
  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Change password for the current user. Requires current password. Invalidates all refresh tokens for security.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully. Please login again.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid password format or new password same as old',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid current password or missing token',
  })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'];
    return this.userService.changePassword(userId, changePasswordDto, ip, userAgent);
  }

  /**
   * Request password reset
   */
  @Post('forgot-password')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      "Send a password reset link to the user's email. Token expires in 1 hour. Rate limited to 3 requests per hour to prevent abuse.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset request processed',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If an account exists with this email, a password reset link will be sent.',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'];
    return this.userService.forgotPassword(forgotPasswordDto, ip, userAgent);
  }

  /**
   * Reset password with token
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Reset password using the token received via email. Invalidates all refresh tokens for security.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset successfully. Please login with your new password.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or expired token',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'];
    return this.userService.resetPassword(resetPasswordDto, ip, userAgent);
  }

  /**
   * Resend email verification
   */
  @Post('resend-verification')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification',
    description:
      'Resend email verification link. Token expires in 24 hours. Rate limited to 5 requests per hour.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent if applicable',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If your email is registered and not verified, a verification link will be sent.',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async resendVerification(
    @Body() resendDto: ResendVerificationDto,
    @Req() req: Request,
    @Ip() ip: string,
  ): Promise<{ message: string }> {
    const userAgent = req.headers['user-agent'];
    return this.userService.resendVerification(resendDto, ip, userAgent);
  }
}
