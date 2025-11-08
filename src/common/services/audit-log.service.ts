import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@/database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create audit log entry
   */
  async createLog(data: CreateAuditLogDto): Promise<AuditLog | null> {
    try {
      const auditLog = this.auditLogRepository.create({
        user_id: data.userId || null,
        action: data.action,
        description: data.description || null,
        old_values: data.oldValues || null,
        new_values: data.newValues || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        metadata: data.metadata || null,
      });

      const saved = await this.auditLogRepository.save(auditLog);

      this.logger.log(`Audit log created: ${data.action} for user ${data.userId || 'unknown'}`);

      return saved;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<[AuditLog[], number]> {
    return await this.auditLogRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get logs by action type
   */
  async getLogsByAction(action: AuditAction, limit: number = 50): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { action },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
