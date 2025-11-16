import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/database/entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.MERCHANT,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
