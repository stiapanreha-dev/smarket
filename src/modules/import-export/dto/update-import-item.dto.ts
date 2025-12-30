import { IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ImportItemStatus,
  ImportItemAction,
  MappedData,
} from '@database/entities/import-item.entity';

export class UpdateImportItemDto {
  @ApiPropertyOptional({
    description: 'New status for the item',
    enum: ImportItemStatus,
  })
  @IsOptional()
  @IsEnum(ImportItemStatus)
  status?: ImportItemStatus;

  @ApiPropertyOptional({
    description: 'Action to perform (insert, update, skip)',
    enum: ImportItemAction,
  })
  @IsOptional()
  @IsEnum(ImportItemAction)
  action?: ImportItemAction;

  @ApiPropertyOptional({
    description: 'Manually matched product ID',
  })
  @IsOptional()
  @IsUUID()
  matched_product_id?: string;

  @ApiPropertyOptional({
    description: 'Manually matched variant ID',
  })
  @IsOptional()
  @IsUUID()
  matched_variant_id?: string;

  @ApiPropertyOptional({
    description: 'Updated mapped data',
  })
  @IsOptional()
  @IsObject()
  mapped_data?: MappedData;
}

export class ApproveAllItemsDto {
  @ApiPropertyOptional({
    description: 'Only approve items with these statuses',
    type: [String],
    enum: ImportItemStatus,
  })
  @IsOptional()
  @IsEnum(ImportItemStatus, { each: true })
  statuses?: ImportItemStatus[];
}
