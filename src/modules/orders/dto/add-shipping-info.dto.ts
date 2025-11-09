import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddShippingInfoDto {
  @ApiProperty({
    description: 'Tracking number',
    example: '1Z999AA10123456784',
  })
  @IsString()
  @IsNotEmpty()
  tracking_number: string;

  @ApiProperty({
    description: 'Shipping carrier',
    example: 'UPS',
  })
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @ApiPropertyOptional({
    description: 'Estimated delivery date',
    example: '2024-02-20T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  estimated_delivery?: string;
}
