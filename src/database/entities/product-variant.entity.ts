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
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Product } from './product.entity';

export enum InventoryPolicy {
  DENY = 'deny', // Cannot sell if out of stock
  CONTINUE = 'continue', // Can sell even if out of stock
  TRACK = 'track', // Track inventory but don't enforce
}

export enum VariantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

@Entity('product_variants')
@Index(['product_id'])
@Index(['sku'], { unique: true })
@Index(['product_id', 'status'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  title: string | null;

  @Column({ type: 'bigint' })
  @IsNumber()
  @Min(0)
  price_minor: number; // Price in minor units (cents)

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  @IsString()
  currency: string;

  @Column({ type: 'bigint', nullable: true })
  @IsNumber()
  @IsOptional()
  compare_at_price_minor: number | null; // Original price for discounts

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  inventory_quantity: number;

  @Column({
    type: 'enum',
    enum: InventoryPolicy,
    default: InventoryPolicy.DENY,
  })
  @IsEnum(InventoryPolicy)
  inventory_policy: InventoryPolicy;

  @Column({
    type: 'enum',
    enum: VariantStatus,
    default: VariantStatus.ACTIVE,
  })
  @IsEnum(VariantStatus)
  status: VariantStatus;

  @Column({ type: 'jsonb', nullable: true })
  attrs: {
    size?: string;
    color?: string;
    material?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    // For services
    duration?: number; // in minutes
    capacity?: number;
    // For courses
    access_duration?: number; // in days
    [key: string]: any;
  } | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  image_url: string | null;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  position: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsNumber()
  @IsOptional()
  weight: number | null; // in kg

  @Column({ type: 'boolean', default: true })
  requires_shipping: boolean;

  @Column({ type: 'boolean', default: true })
  taxable: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  barcode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Virtual fields
  get price(): number {
    return this.price_minor / 100;
  }

  get compare_at_price(): number | null {
    return this.compare_at_price_minor ? this.compare_at_price_minor / 100 : null;
  }

  get is_on_sale(): boolean {
    return this.compare_at_price_minor !== null && this.compare_at_price_minor > this.price_minor;
  }

  get discount_percentage(): number | null {
    if (!this.is_on_sale || !this.compare_at_price_minor) {
      return null;
    }
    return Math.round(
      ((this.compare_at_price_minor - this.price_minor) / this.compare_at_price_minor) * 100,
    );
  }

  get is_in_stock(): boolean {
    if (this.inventory_policy === InventoryPolicy.CONTINUE) {
      return true;
    }
    return this.inventory_quantity > 0;
  }
}
