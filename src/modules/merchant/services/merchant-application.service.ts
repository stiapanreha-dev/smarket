import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  MerchantApplication,
  ApplicationStatus,
} from '@/database/entities/merchant-application.entity';
import {
  Merchant,
  MerchantStatus,
  KycStatus,
  PayoutMethod,
} from '@/database/entities/merchant.entity';
import { User, UserRole } from '@/database/entities/user.entity';
import {
  CreateMerchantApplicationDto,
  ApproveMerchantApplicationDto,
  RejectMerchantApplicationDto,
} from '../dto/merchant-application.dto';

@Injectable()
export class MerchantApplicationService {
  constructor(
    @InjectRepository(MerchantApplication)
    private readonly applicationRepository: Repository<MerchantApplication>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create merchant application
   */
  async createApplication(
    userId: string,
    dto: CreateMerchantApplicationDto,
  ): Promise<MerchantApplication> {
    // Check if user already has a merchant profile
    const existingMerchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (existingMerchant) {
      throw new ConflictException('You are already a merchant');
    }

    // Check if user has a pending application
    const existingApplication = await this.applicationRepository.findOne({
      where: { user_id: userId, status: ApplicationStatus.PENDING },
    });

    if (existingApplication) {
      throw new ConflictException('You already have a pending application');
    }

    // Create application
    const application = this.applicationRepository.create({
      user_id: userId,
      legal_name: dto.legal_name,
      display_name: dto.display_name,
      description: dto.description,
      website: dto.website,
      tax_id: dto.tax_id,
      business_address: dto.business_address,
      status: ApplicationStatus.PENDING,
    });

    return this.applicationRepository.save(application);
  }

  /**
   * Get user's application
   */
  async getUserApplication(userId: string): Promise<MerchantApplication | null> {
    return this.applicationRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get all pending applications (admin)
   */
  async getPendingApplications(): Promise<MerchantApplication[]> {
    return this.applicationRepository.find({
      where: { status: ApplicationStatus.PENDING },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Get all applications (admin)
   */
  async getAllApplications(status?: ApplicationStatus): Promise<MerchantApplication[]> {
    const where = status ? { status } : {};
    return this.applicationRepository.find({
      where,
      relations: ['user', 'reviewer'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get application by ID (admin)
   */
  async getApplicationById(id: string): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['user', 'reviewer'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Approve application and create merchant profile (admin)
   */
  async approveApplication(
    applicationId: string,
    adminId: string,
    dto: ApproveMerchantApplicationDto,
  ): Promise<{ application: MerchantApplication; merchant: Merchant }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get application
      const application = await queryRunner.manager.findOne(MerchantApplication, {
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException('Application is not pending');
      }

      // Check if user already has a merchant profile
      const existingMerchant = await queryRunner.manager.findOne(Merchant, {
        where: { owner_id: application.user_id },
      });

      if (existingMerchant) {
        throw new ConflictException('User is already a merchant');
      }

      // Update application status
      application.status = ApplicationStatus.APPROVED;
      application.reviewed_by = adminId;
      application.reviewed_at = new Date();
      application.review_notes = dto.notes ?? null;
      await queryRunner.manager.save(application);

      // Create merchant profile
      const merchant = queryRunner.manager.create(Merchant, {
        owner_id: application.user_id,
        legal_name: application.legal_name,
        display_name: application.display_name || application.legal_name,
        description: application.description,
        website: application.website,
        tax_id: application.tax_id,
        business_address: application.business_address,
        kyc_status: KycStatus.PENDING,
        payout_method: PayoutMethod.BANK_TRANSFER,
        status: MerchantStatus.ACTIVE,
      });
      const savedMerchant = await queryRunner.manager.save(merchant);

      // Update application with merchant ID
      application.merchant_id = savedMerchant.id;
      await queryRunner.manager.save(application);

      // Update user role to merchant
      await queryRunner.manager.update(
        User,
        { id: application.user_id },
        { role: UserRole.MERCHANT },
      );

      await queryRunner.commitTransaction();

      return { application, merchant: savedMerchant };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject application (admin)
   */
  async rejectApplication(
    applicationId: string,
    adminId: string,
    dto: RejectMerchantApplicationDto,
  ): Promise<MerchantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    application.status = ApplicationStatus.REJECTED;
    application.reviewed_by = adminId;
    application.reviewed_at = new Date();
    application.rejection_reason = dto.reason;

    return this.applicationRepository.save(application);
  }
}
