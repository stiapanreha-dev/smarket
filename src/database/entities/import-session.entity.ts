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
import { Merchant } from './merchant.entity';
import { User } from './user.entity';

export enum ImportSessionStatus {
  PENDING = 'pending',
  PARSING = 'parsing',
  PARSED = 'parsed',
  ANALYZING = 'analyzing',
  ANALYZED = 'analyzed',
  RECONCILING = 'reconciling',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ImportFileFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  XLS = 'xls',
  YML = 'yml',
  XML = 'xml',
  JSON = 'json',
}

export interface ColumnMapping {
  source_column: string;
  target_field: string;
  confidence: number;
  transform?: string;
}

export interface AnalysisResult {
  detected_columns: string[];
  column_mapping: ColumnMapping[];
  suggestions: string[];
  warnings: string[];
  sample_data: Record<string, string>[];
}

@Entity('import_sessions')
@Index(['merchant_id'])
@Index(['user_id'])
@Index(['status'])
@Index(['merchant_id', 'status'])
export class ImportSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchant_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  @IsNotEmpty()
  original_filename: string;

  @Column({
    type: 'enum',
    enum: ImportFileFormat,
  })
  @IsEnum(ImportFileFormat)
  file_format: ImportFileFormat;

  @Column({
    type: 'enum',
    enum: ImportSessionStatus,
    default: ImportSessionStatus.PENDING,
  })
  @IsEnum(ImportSessionStatus)
  status: ImportSessionStatus;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  total_rows: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  processed_rows: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  success_count: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  error_count: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  skip_count: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  new_count: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  update_count: number;

  @Column({ type: 'jsonb', nullable: true })
  analysis_result: AnalysisResult | null;

  @Column({ type: 'jsonb', nullable: true })
  column_mapping: ColumnMapping[] | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  error_message: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Merchant, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Virtual fields
  get progress_percentage(): number {
    if (this.total_rows === 0) return 0;
    return Math.round((this.processed_rows / this.total_rows) * 100);
  }

  get is_completed(): boolean {
    return this.status === ImportSessionStatus.COMPLETED;
  }

  get is_failed(): boolean {
    return this.status === ImportSessionStatus.FAILED;
  }

  get is_in_progress(): boolean {
    return [
      ImportSessionStatus.PARSING,
      ImportSessionStatus.ANALYZING,
      ImportSessionStatus.EXECUTING,
    ].includes(this.status);
  }
}
