import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { AdminUserController } from './admin-user.controller';
import { UserService } from './user.service';
import { User } from '@/database/entities/user.entity';
import { Merchant } from '@/database/entities/merchant.entity';
import { RefreshToken } from '@/database/entities/refresh-token.entity';
import { AuditLog } from '@/database/entities/audit-log.entity';
import { UserAddress } from '@/database/entities/user-address.entity';
import { EmailService } from '@/common/services/email.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Merchant, RefreshToken, AuditLog, UserAddress])],
  controllers: [UserController, AdminUserController],
  providers: [UserService, EmailService, AuditLogService],
  exports: [UserService],
})
export class UserModule {}
