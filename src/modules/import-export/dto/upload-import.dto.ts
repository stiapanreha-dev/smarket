import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImportDto {
  @ApiPropertyOptional({
    description: 'Custom name for the import session',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UploadImportResponseDto {
  @ApiProperty({ description: 'Import session ID' })
  session_id: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'Detected file format' })
  file_format: string;

  @ApiProperty({ description: 'Total rows parsed' })
  total_rows: number;

  @ApiProperty({ description: 'Session status' })
  status: string;

  @ApiProperty({ description: 'Sample of detected columns' })
  detected_columns: string[];
}
