import { IsString, IsNumber, IsObject, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VatMode } from '@database/entities';

export class UpdateVatSettingsDto {
  @ApiProperty({
    description: 'VAT calculation mode',
    enum: ['included', 'on_top'],
    example: 'included',
  })
  @IsString()
  @IsIn(['included', 'on_top'])
  mode: VatMode;

  @ApiProperty({
    description: 'Default VAT rate in percentage',
    example: 22,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  default_rate: number;

  @ApiProperty({
    description: 'Country-specific VAT rates',
    example: { RU: 22, GB: 20, DE: 19, AE: 5, US: 0 },
  })
  @IsObject()
  @Transform(({ value }) => {
    // Convert all values to numbers
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, number> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = typeof val === 'string' ? parseFloat(val) : Number(val);
      }
      return result;
    }
    return value;
  })
  country_rates: Record<string, number>;
}
