import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ImportSession } from '@database/entities/import-session.entity';
import { ImportItem } from '@database/entities/import-item.entity';
import { Product } from '@database/entities/product.entity';
import { ProductVariant } from '@database/entities/product-variant.entity';
import { Merchant } from '@database/entities/merchant.entity';
import { ImportExportController } from './controllers/import-export.controller';
import { ExportService } from './services/export.service';
import { ImportService } from './services/import.service';
import { FileParserService } from './services/file-parser.service';
import { AiAnalyzerService } from './services/ai-analyzer.service';
import { ProductMatcherService } from './services/product-matcher.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ImportSession, ImportItem, Product, ProductVariant, Merchant]),
  ],
  controllers: [ImportExportController],
  providers: [
    ExportService,
    ImportService,
    FileParserService,
    AiAnalyzerService,
    ProductMatcherService,
  ],
  exports: [ExportService, ImportService],
})
export class ImportExportModule {}
