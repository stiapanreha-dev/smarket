import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User, UserRole } from '@/database/entities/user.entity';
import { Merchant } from '@/database/entities/merchant.entity';
import { RefreshToken } from '@/database/entities/refresh-token.entity';
import { UserAddress } from '@/database/entities/user-address.entity';
import { Order, OrderStatus, PaymentStatus } from '@/database/entities/order.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { DashboardStatsDto, RecentOrderDto } from './dto/dashboard-stats.dto';
import { EmailService } from '@/common/services/email.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { AuditAction } from '@/database/entities/audit-log.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get a user profile by ID
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

  // ==================== Address Management ====================

  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });

    return addresses;
  }

  /**
   * Get a specific address by ID
   */
  async getUserAddress(userId: string, addressId: string): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  /**
   * Create a new address
   */
  async createAddress(userId: string, createDto: CreateAddressDto): Promise<AddressResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If this is marked as default or user has no addresses, set it as default
      const existingAddresses = await queryRunner.manager.count(UserAddress, {
        where: { user_id: userId },
      });

      const shouldBeDefault = createDto.is_default || existingAddresses === 0;

      // If setting as default, unset other defaults
      if (shouldBeDefault) {
        await queryRunner.manager.update(
          UserAddress,
          { user_id: userId, is_default: true },
          { is_default: false },
        );
      }

      // Create the new address
      const address = queryRunner.manager.create(UserAddress, {
        user_id: userId,
        full_name: createDto.full_name,
        phone: createDto.phone,
        address_line1: createDto.address_line1,
        address_line2: createDto.address_line2 || null,
        city: createDto.city,
        state: createDto.state || null,
        postal_code: createDto.postal_code,
        country: createDto.country,
        is_default: shouldBeDefault,
      });

      const savedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();

      return savedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(UserAddress, {
        where: { id: addressId, user_id: userId },
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      // If setting as default, unset other defaults
      if (updateDto.is_default && !address.is_default) {
        await queryRunner.manager.update(
          UserAddress,
          { user_id: userId, is_default: true },
          { is_default: false },
        );
      }

      // Update fields
      if (updateDto.full_name !== undefined) address.full_name = updateDto.full_name;
      if (updateDto.phone !== undefined) address.phone = updateDto.phone;
      if (updateDto.address_line1 !== undefined) address.address_line1 = updateDto.address_line1;
      if (updateDto.address_line2 !== undefined)
        address.address_line2 = updateDto.address_line2 || null;
      if (updateDto.city !== undefined) address.city = updateDto.city;
      if (updateDto.state !== undefined) address.state = updateDto.state || null;
      if (updateDto.postal_code !== undefined) address.postal_code = updateDto.postal_code;
      if (updateDto.country !== undefined) address.country = updateDto.country;
      if (updateDto.is_default !== undefined) address.is_default = updateDto.is_default;

      const updatedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();

      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(userId: string, addressId: string): Promise<{ message: string }> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepository.remove(address);

    // If deleted address was default, set another as default
    if (address.is_default) {
      const remainingAddresses = await this.addressRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: 1,
      });

      if (remainingAddresses.length > 0) {
        remainingAddresses[0].is_default = true;
        await this.addressRepository.save(remainingAddresses[0]);
      }
    }

    return { message: 'Address deleted successfully' };
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<AddressResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(UserAddress, {
        where: { id: addressId, user_id: userId },
      });

      if (!address) {
        throw new NotFoundException('Address not found');
      }

      // Unset all other defaults
      await queryRunner.manager.update(
        UserAddress,
        { user_id: userId, is_default: true },
        { is_default: false },
      );

      // Set this as default
      address.is_default = true;
      const updatedAddress = await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();

      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== Dashboard Stats ====================

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.orderRepository.find({
      where: { user_id: userId },
      relations: ['line_items'],
      order: { created_at: 'DESC' },
    });

    const totalOrders = orders.length;

    // Sum of total_amount for captured payments
    const totalSpent = orders
      .filter((o) => o.payment_status === PaymentStatus.CAPTURED)
      .reduce((sum, o) => sum + o.total_amount, 0);

    // Active orders: pending, confirmed, processing
    const activeStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
    const activeOrders = orders.filter((o) => activeStatuses.includes(o.status)).length;

    // Pending actions: orders with pending status or pending payment
    const pendingActions = orders.filter(
      (o) => o.status === OrderStatus.PENDING || o.payment_status === PaymentStatus.PENDING,
    ).length;

    // Orders grouped by status
    const ordersByStatus = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Recent 5 orders with minimal data
    const recentOrders: RecentOrderDto[] = orders.slice(0, 5).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total_amount: order.total_amount,
      currency: order.currency,
      created_at: order.created_at,
      items_count: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    }));

    return {
      totalOrders,
      totalSpent,
      currency: user.currency || 'USD',
      activeOrders,
      pendingActions,
      ordersByStatus,
      recentOrders,
    };
  }

  // ==================== Admin Methods ====================

  /**
   * Get all users with filters (Admin only)
   */
  async getAllUsers(filters: { role?: UserRole; search?: string; page?: number; limit?: number }) {
    const { role, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.role',
        'user.email_verified',
        'user.phone',
        'user.created_at',
      ])
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get platform-wide statistics (Admin only)
   */
  async getAdminDashboardStats() {
    // Get user counts by role
    const userCounts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const totalUsers = userCounts.reduce((sum, r) => sum + parseInt(r.count), 0);
    const usersByRole = userCounts.reduce(
      (acc, r) => {
        acc[r.role] = parseInt(r.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await this.userRepository.count({
      where: { created_at: MoreThan(today) },
    });

    // Get users registered this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await this.userRepository.count({
      where: { created_at: MoreThan(weekAgo) },
    });

    // Get order statistics
    const orderStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect(
        'SUM(CASE WHEN order.payment_status = :captured THEN order.total_amount ELSE 0 END)',
        'totalRevenue',
      )
      .addSelect('COUNT(CASE WHEN order.status = :pending THEN 1 END)', 'pendingOrders')
      .addSelect('COUNT(CASE WHEN order.status = :processing THEN 1 END)', 'processingOrders')
      .addSelect('COUNT(CASE WHEN order.status = :completed THEN 1 END)', 'completedOrders')
      .setParameter('captured', PaymentStatus.CAPTURED)
      .setParameter('pending', OrderStatus.PENDING)
      .setParameter('processing', OrderStatus.PROCESSING)
      .setParameter('completed', OrderStatus.COMPLETED)
      .getRawOne();

    // Get orders today
    const ordersToday = await this.orderRepository.count({
      where: { created_at: MoreThan(today) },
    });

    // Get pending merchant applications count
    const pendingMerchantApplications = await this.merchantRepository.count({
      where: { kyc_status: 'pending' as any },
    });

    // Get recent orders (last 10)
    const recentOrders = await this.orderRepository.find({
      order: { created_at: 'DESC' },
      take: 10,
      relations: ['user'],
    });

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
      },
      orders: {
        total: parseInt(orderStats?.totalOrders || '0'),
        pending: parseInt(orderStats?.pendingOrders || '0'),
        processing: parseInt(orderStats?.processingOrders || '0'),
        completed: parseInt(orderStats?.completedOrders || '0'),
        today: ordersToday,
      },
      revenue: {
        total: parseFloat(orderStats?.totalRevenue || '0'),
        currency: 'USD',
      },
      pendingMerchantApplications,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        currency: order.currency,
        created_at: order.created_at,
        customer: order.user
          ? {
              id: order.user.id,
              email: order.user.email,
              name: `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim(),
            }
          : null,
      })),
    };
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(userId: string, newRole: UserRole) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If changing to merchant role, create merchant profile
    if (newRole === UserRole.MERCHANT && user.role !== UserRole.MERCHANT) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update user role
        user.role = newRole;
        await queryRunner.manager.save(user);

        // Create merchant profile
        const merchant = queryRunner.manager.create('Merchant', {
          owner_id: userId,
          legal_name: `${user.first_name} ${user.last_name}`,
          display_name: `${user.first_name} ${user.last_name}`,
          kyc_status: 'pending',
          status: 'active',
          payout_method: 'bank_transfer',
        });
        await queryRunner.manager.save('Merchant', merchant);

        await queryRunner.commitTransaction();

        this.logger.log(`User ${userId} promoted to merchant by admin`);

        return this.getProfile(userId, true);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    // For other role changes, just update the role
    user.role = newRole;
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} role changed to ${newRole} by admin`);

    return this.getProfile(userId, true);
  }
}
