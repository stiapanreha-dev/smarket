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
import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ImportSession } from './import-session.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

export enum ImportItemStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  NEW = 'new',
  CONFLICT = 'conflict',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPORTED = 'imported',
  ERROR = 'error',
}

export enum ImportItemAction {
  INSERT = 'insert',
  UPDATE = 'update',
  SKIP = 'skip',
}

export enum MatchMethod {
  SKU = 'sku',
  TITLE = 'title',
  BARCODE = 'barcode',
  MANUAL = 'manual',
  AI = 'ai',
}

export interface FieldChange {
  field: string;
  old_value: string | number | null;
  new_value: string | number | null;
}

export interface MappedProductData {
  title?: string;
  short_description?: string;
  description?: string;
  type?: string;
  status?: string;
  base_price_minor?: number;
  currency?: string;
  image_url?: string;
  images?: string[];
  category?: string[];
  tags?: string[];
  brand?: string;
  weight?: number;
  slug?: string;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
  [key: string]: any;
}

export interface MappedVariantData {
  sku?: string;
  title?: string;
  price_minor?: number;
  compare_at_price_minor?: number;
  inventory_quantity?: number;
  inventory_policy?: string;
  barcode?: string;
  weight?: number;
  requires_shipping?: boolean;
  taxable?: boolean;
  attrs?: Record<string, any>;
  [key: string]: any;
}

export interface MappedData {
  product: MappedProductData;
  variant: MappedVariantData;
}

@Entity('import_items')
@Index(['session_id'])
@Index(['status'])
@Index(['session_id', 'status'])
@Index(['session_id', 'row_number'])
@Index(['matched_product_id'])
@Index(['matched_variant_id'])
export class ImportItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'int' })
  @IsNumber()
  @Min(1)
  row_number: number;

  @Column({
    type: 'enum',
    enum: ImportItemStatus,
    default: ImportItemStatus.PENDING,
  })
  @IsEnum(ImportItemStatus)
  status: ImportItemStatus;

  @Column({
    type: 'enum',
    enum: ImportItemAction,
    default: ImportItemAction.INSERT,
  })
  @IsEnum(ImportItemAction)
  action: ImportItemAction;

  @Column({ type: 'jsonb' })
  raw_data: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  mapped_data: MappedData | null;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  matched_product_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  matched_variant_id: string | null;

  @Column({
    type: 'enum',
    enum: MatchMethod,
    nullable: true,
  })
  @IsEnum(MatchMethod)
  @IsOptional()
  matched_by: MatchMethod | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  match_confidence: number | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: FieldChange[] | null;

  @Column({ type: 'jsonb', nullable: true })
  validation_errors: string[] | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  error_message: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  created_product_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  created_variant_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => ImportSession, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: ImportSession;

  @ManyToOne(() => Product, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'matched_product_id' })
  matched_product: Product | null;

  @ManyToOne(() => ProductVariant, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'matched_variant_id' })
  matched_variant: ProductVariant | null;

  @ManyToOne(() => Product, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_product_id' })
  created_product: Product | null;

  @ManyToOne(() => ProductVariant, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_variant_id' })
  created_variant: ProductVariant | null;

  // Virtual fields
  get is_new(): boolean {
    return this.status === ImportItemStatus.NEW;
  }

  get is_update(): boolean {
    return this.status === ImportItemStatus.MATCHED && this.action === ImportItemAction.UPDATE;
  }

  get has_changes(): boolean {
    return this.changes !== null && this.changes.length > 0;
  }

  get has_errors(): boolean {
    return (
      (this.validation_errors !== null && this.validation_errors.length > 0) ||
      this.error_message !== null
    );
  }

  get can_be_approved(): boolean {
    return [
      ImportItemStatus.PENDING,
      ImportItemStatus.MATCHED,
      ImportItemStatus.NEW,
      ImportItemStatus.CONFLICT,
    ].includes(this.status);
  }

  get sku(): string | null {
    return this.mapped_data?.variant?.sku || null;
  }

  get product_title(): string | null {
    return this.mapped_data?.product?.title || null;
  }
}
