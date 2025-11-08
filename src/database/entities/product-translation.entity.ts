import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Product } from './product.entity';

export enum TranslationLocale {
  EN = 'en',
  RU = 'ru',
  AR = 'ar',
}

@Entity('product_translations')
@Index(['product_id', 'locale'], { unique: true })
@Index(['locale'])
// GIN index for full-text search (will be added in migration)
export class ProductTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({
    type: 'enum',
    enum: TranslationLocale,
  })
  @IsEnum(TranslationLocale)
  locale: TranslationLocale;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  slug: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attrs: {
    short_description?: string;
    features?: string[];
    specifications?: Record<string, string>;
    seo_title?: string;
    seo_description?: string;
    keywords?: string[];
    [key: string]: any;
  } | null;

  // Full-text search vector (for PostgreSQL tsvector)
  @Column({
    type: 'tsvector',
    nullable: true,
    select: false,
  })
  search_vector: any;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
