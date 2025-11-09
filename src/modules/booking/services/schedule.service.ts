import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule, Service } from '@database/entities';
import { CreateScheduleDto, UpdateScheduleDto } from '../dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  /**
   * Create a new schedule
   */
  async createSchedule(dto: CreateScheduleDto): Promise<Schedule> {
    this.logger.log(`Creating schedule for service ${dto.service_id}`);

    // Verify service exists
    const service = await this.serviceRepository.findOne({
      where: { id: dto.service_id },
    });

    if (!service) {
      throw new NotFoundException(`Service ${dto.service_id} not found`);
    }

    // Check if schedule already exists for this service-provider combination
    const existing = await this.scheduleRepository.findOne({
      where: {
        service_id: dto.service_id,
        provider_id: dto.provider_id || null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Schedule already exists for this service and provider combination',
      );
    }

    const schedule = this.scheduleRepository.create({
      service_id: dto.service_id,
      provider_id: dto.provider_id,
      timezone: dto.timezone || 'UTC',
      weekly_slots: dto.weekly_slots,
      exceptions: dto.exceptions || [],
      metadata: dto.metadata || {},
    });

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['service', 'provider'],
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }

    return schedule;
  }

  /**
   * Get schedule for a service (and optionally provider)
   */
  async getScheduleForService(
    serviceId: string,
    providerId?: string,
  ): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({
      where: {
        service_id: serviceId,
        ...(providerId && { provider_id: providerId }),
      },
      relations: ['service', 'provider'],
    });
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const schedule = await this.getSchedule(scheduleId);

    // Update fields
    if (dto.timezone) schedule.timezone = dto.timezone;
    if (dto.weekly_slots) schedule.weekly_slots = dto.weekly_slots;
    if (dto.exceptions !== undefined) schedule.exceptions = dto.exceptions;
    if (dto.metadata) schedule.metadata = { ...schedule.metadata, ...dto.metadata };

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId);
    await this.scheduleRepository.remove(schedule);
    this.logger.log(`Schedule ${scheduleId} deleted`);
  }

  /**
   * Get all schedules for a provider
   */
  async getProviderSchedules(providerId: string): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { provider_id: providerId },
      relations: ['service'],
    });
  }
}
