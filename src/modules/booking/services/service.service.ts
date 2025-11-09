import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServiceStatus } from '@database/entities';
import { CreateServiceDto, UpdateServiceDto } from '../dto';

@Injectable()
export class ServiceService {
  private readonly logger = new Logger(ServiceService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new service
   */
  async createService(dto: CreateServiceDto): Promise<Service> {
    this.logger.log(`Creating service for merchant ${dto.merchant_id}`);

    const service = this.serviceRepository.create({
      merchant_id: dto.merchant_id,
      provider_id: dto.provider_id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      duration_minutes: dto.duration_minutes,
      buffer_minutes: dto.buffer_minutes || 0,
      price_minor: dto.price_minor,
      currency: dto.currency || 'USD',
      status: ServiceStatus.ACTIVE,
      metadata: dto.metadata || {},
    });

    return this.serviceRepository.save(service);
  }

  /**
   * Get service by ID
   */
  async getService(serviceId: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['merchant', 'provider'],
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    return service;
  }

  /**
   * Get all services for a merchant
   */
  async getMerchantServices(merchantId: string, includeInactive = false): Promise<Service[]> {
    const where: any = { merchant_id: merchantId };

    if (!includeInactive) {
      where.status = ServiceStatus.ACTIVE;
    }

    return this.serviceRepository.find({
      where,
      relations: ['provider'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get services by provider
   */
  async getProviderServices(providerId: string): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        provider_id: providerId,
        status: ServiceStatus.ACTIVE,
      },
      relations: ['merchant'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get all active services (public catalog)
   */
  async getActiveServices(category?: string): Promise<Service[]> {
    const where: any = { status: ServiceStatus.ACTIVE };

    if (category) {
      where.category = category;
    }

    return this.serviceRepository.find({
      where,
      relations: ['merchant', 'provider'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Update service
   */
  async updateService(serviceId: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.getService(serviceId);

    // Update fields
    if (dto.name) service.name = dto.name;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.category) service.category = dto.category;
    if (dto.duration_minutes) service.duration_minutes = dto.duration_minutes;
    if (dto.buffer_minutes !== undefined) service.buffer_minutes = dto.buffer_minutes;
    if (dto.price_minor) service.price_minor = dto.price_minor;
    if (dto.currency) service.currency = dto.currency;
    if (dto.status) service.status = dto.status;
    if (dto.metadata) service.metadata = { ...service.metadata, ...dto.metadata };

    return this.serviceRepository.save(service);
  }

  /**
   * Deactivate service (soft delete)
   */
  async deactivateService(serviceId: string): Promise<Service> {
    const service = await this.getService(serviceId);
    service.status = ServiceStatus.INACTIVE;
    return this.serviceRepository.save(service);
  }

  /**
   * Archive service
   */
  async archiveService(serviceId: string): Promise<Service> {
    const service = await this.getService(serviceId);
    service.status = ServiceStatus.ARCHIVED;
    return this.serviceRepository.save(service);
  }

  /**
   * Delete service (hard delete)
   * Only allowed if no bookings exist
   */
  async deleteService(serviceId: string): Promise<void> {
    const service = await this.getService(serviceId);

    // TODO: Check if any bookings exist
    // const bookingCount = await this.bookingRepository.count({
    //   where: { service_id: serviceId }
    // });
    //
    // if (bookingCount > 0) {
    //   throw new BadRequestException(
    //     'Cannot delete service with existing bookings. Archive instead.'
    //   );
    // }

    await this.serviceRepository.remove(service);
    this.logger.log(`Service ${serviceId} deleted`);
  }
}
