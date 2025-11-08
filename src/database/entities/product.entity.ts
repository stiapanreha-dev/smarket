import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Merchant } from './merchant.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductTranslation } from './product-translation.entity';

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  SERVICE = 'SERVICE',
  COURSE = 'COURSE',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

@Entity('products')
@Index(['merchant_id'])
@Index(['type'])
@Index(['status'])
@Index(['merchant_id', 'status'])
@Index(['type', 'status'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchant_id: string;

  @Column({
    type: 'enum',
    enum: ProductType,
  })
  @IsEnum(ProductType)
  type: ProductType;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  @IsString()
  @IsOptional()
  slug: string | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  attrs: {
    brand?: string;
    color?: string;
    size?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    category?: string[];
    tags?: string[];
    [key: string]: any;
  } | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  image_url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  images: string[] | null;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  view_count: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  sales_count: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  rating: number | null;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  review_count: number;

  @Column({ type: 'jsonb', nullable: true })
  seo: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  } | null;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Merchant, (merchant) => merchant.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductTranslation, (translation) => translation.product)
  translations: ProductTranslation[];

  // Virtual fields
  get is_published(): boolean {
    return this.status === ProductStatus.ACTIVE && this.published_at !== null;
  }

  get is_physical(): boolean {
    return this.type === ProductType.PHYSICAL;
  }

  get is_service(): boolean {
    return this.type === ProductType.SERVICE;
  }

  get is_course(): boolean {
    return this.type === ProductType.COURSE;
  }
}
