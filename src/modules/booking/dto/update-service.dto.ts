import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '@database/entities/service.entity';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional({
    description: 'Service status',
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;
}
