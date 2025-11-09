import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranslationLocale } from '../../../database/entities/product-translation.entity';

export class ProductTranslationDto {
  @ApiProperty({
    enum: TranslationLocale,
    description: 'Translation locale',
    example: TranslationLocale.EN,
  })
  @IsEnum(TranslationLocale)
  locale: TranslationLocale;

  @ApiProperty({
    description: 'Product title in specified locale',
    example: 'Premium Wireless Headphones',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Product description in specified locale',
    example: 'High-quality wireless headphones with noise cancellation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'SEO-friendly slug (auto-generated if not provided)',
    example: 'premium-wireless-headphones',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Additional localized attributes',
    example: {
      short_description: 'Premium headphones',
      seo_title: 'Buy Premium Wireless Headphones',
      seo_description: 'Best wireless headphones with noise cancellation',
      keywords: ['headphones', 'wireless', 'premium'],
    },
  })
  @IsOptional()
  attrs?: {
    short_description?: string;
    features?: string[];
    specifications?: Record<string, string>;
    seo_title?: string;
    seo_description?: string;
    keywords?: string[];
    [key: string]: any;
  };
}
