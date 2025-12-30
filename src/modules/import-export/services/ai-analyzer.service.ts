import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ImportSession, ImportSessionStatus } from '@database/entities/import-session.entity';
import {
  ImportItem,
  ImportItemStatus,
  ImportItemAction,
} from '@database/entities/import-item.entity';
import { RawImportRow } from '../parsers/base-parser.interface';

// Target schema for product mapping
const PRODUCT_SCHEMA = {
  product: {
    title: 'Product title/name',
    short_description: 'Short product description',
    description: 'Full product description',
    type: 'Product type (PHYSICAL, DIGITAL, SERVICE)',
    status: 'Product status (draft, active, deleted)',
    base_price_minor: 'Base price in minor units (cents)',
    currency: 'Currency code (USD, RUB, EUR)',
    image_url: 'Main product image URL',
    images: 'Array of additional image URLs',
    slug: 'URL-friendly slug',
    category: 'Product category',
    tags: 'Product tags array',
    brand: 'Brand name',
    weight: 'Product weight',
    seo: {
      meta_title: 'SEO meta title',
      meta_description: 'SEO meta description',
      keywords: 'SEO keywords array',
    },
  },
  variant: {
    sku: 'Stock Keeping Unit (unique identifier)',
    title: 'Variant title',
    price_minor: 'Variant price in minor units',
    compare_at_price_minor: 'Compare at price (original price)',
    inventory_quantity: 'Stock quantity',
    inventory_policy: 'Inventory policy (deny, continue)',
    barcode: 'Barcode (EAN, UPC)',
    weight: 'Variant weight',
    requires_shipping: 'Requires shipping (boolean)',
    taxable: 'Is taxable (boolean)',
    attrs: 'Custom variant attributes',
  },
};

// Common column name patterns for fallback mapping
const COLUMN_PATTERNS: Record<string, RegExp[]> = {
  // Product ID for direct matching (our export format)
  'product.id': [/^(product[_\s]?id|id)$/i],
  'product.title': [
    /^(product[_\s]?title|title|name|product[_\s]?name|наименование|название|товар)$/i,
  ],
  'product.type': [/^(product[_\s]?type|type|тип)$/i],
  'product.status': [/^(product[_\s]?status|status|статус)$/i],
  'product.short_description': [
    /^(short[_\s]?description|short[_\s]?desc|краткое[_\s]?описание|preview)$/i,
  ],
  'product.description': [/^(description|desc|описание|full[_\s]?desc)$/i],
  'product.base_price_minor': [
    /^(base[_\s]?price[_\s]?minor|base[_\s]?price|price|цена|стоимость|cost)$/i,
  ],
  'product.currency': [/^(currency|валюта|curr)$/i],
  'product.image_url': [/^(image[_\s]?url|image|picture|photo|img|картинка|фото|изображение)$/i],
  'product.images': [/^(images|pictures|photos|gallery|галерея|фотографии)$/i],
  'product.category': [/^(category|категория|cat|categoryId|category[_\s]?id)$/i],
  'product.tags': [/^(tags|теги|keywords|ключевые[_\s]?слова)$/i],
  'product.brand': [/^(brand|бренд|vendor|производитель|manufacturer)$/i],
  'product.weight': [/^(weight|вес|масса)$/i],
  'product.slug': [/^(slug|url|ссылка)$/i],
  'product.meta_title': [/^(meta[_\s]?title|seo[_\s]?title)$/i],
  'product.meta_description': [/^(meta[_\s]?description|seo[_\s]?description)$/i],
  'variant.sku': [/^(variant[_\s]?sku|sku|артикул|vendor[_\s]?code|код|article)$/i],
  'variant.title': [/^(variant[_\s]?title|variant[_\s]?name|вариант)$/i],
  'variant.price_minor': [/^(variant[_\s]?price[_\s]?minor|variant[_\s]?price|sale[_\s]?price)$/i],
  'variant.compare_at_price_minor': [
    /^(variant[_\s]?compare[_\s]?at[_\s]?price[_\s]?minor|compare[_\s]?at[_\s]?price|old[_\s]?price|original[_\s]?price|старая[_\s]?цена)$/i,
  ],
  'variant.inventory_quantity': [
    /^(variant[_\s]?inventory[_\s]?quantity|quantity|qty|stock|остаток|количество|inventory|available)$/i,
  ],
  'variant.inventory_policy': [/^(variant[_\s]?inventory[_\s]?policy|inventory[_\s]?policy)$/i],
  'variant.barcode': [/^(variant[_\s]?barcode|barcode|штрих[_\s]?код|ean|upc|gtin)$/i],
  'variant.weight': [/^(variant[_\s]?weight)$/i],
  'variant.requires_shipping': [/^(variant[_\s]?requires[_\s]?shipping|requires[_\s]?shipping)$/i],
  'variant.taxable': [/^(variant[_\s]?taxable|taxable)$/i],
  'variant.attrs': [/^(variant[_\s]?attrs|attrs|attributes|атрибуты)$/i],
};

export interface ColumnMapping {
  source_column: string;
  target_field: string;
  confidence: number;
  transformation?: string;
}

export interface AnalysisResult {
  detected_columns: string[];
  column_mapping: ColumnMapping[];
  suggestions: string[];
  warnings: string[];
  sample_data: RawImportRow[];
}

export interface MappedProductData {
  product: Record<string, any>;
  variant: Record<string, any>;
}

@Injectable()
export class AiAnalyzerService {
  private readonly logger = new Logger(AiAnalyzerService.name);
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(ImportSession)
    private readonly sessionRepository: Repository<ImportSession>,
    @InjectRepository(ImportItem)
    private readonly itemRepository: Repository<ImportItem>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OpenAI API key not configured, using fallback mapping');
    }
  }

  /**
   * Analyze import session and create column mappings
   */
  async analyzeSession(sessionId: string, merchantId: string): Promise<ImportSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, merchant_id: merchantId },
    });

    if (!session) {
      throw new Error('Import session not found');
    }

    if (session.status !== ImportSessionStatus.PARSED) {
      throw new Error(`Cannot analyze session in status: ${session.status}`);
    }

    // Update status
    session.status = ImportSessionStatus.ANALYZING;
    await this.sessionRepository.save(session);

    try {
      // Get sample items for analysis
      const sampleItems = await this.itemRepository.find({
        where: { session_id: sessionId },
        order: { row_number: 'ASC' },
        take: 10,
      });

      if (sampleItems.length === 0) {
        throw new Error('No items to analyze');
      }

      const sampleRows = sampleItems.map((item) => item.raw_data);
      const columns = Object.keys(sampleRows[0] || {});

      this.logger.log(`Analyzing ${columns.length} columns with ${sampleRows.length} sample rows`);

      // Perform analysis
      let analysisResult: AnalysisResult;

      if (this.openai) {
        try {
          analysisResult = await this.analyzeWithOpenAI(columns, sampleRows);
        } catch (error) {
          this.logger.warn(`OpenAI analysis failed, using fallback: ${(error as Error).message}`);
          analysisResult = this.analyzeWithPatterns(columns, sampleRows);
        }
      } else {
        analysisResult = this.analyzeWithPatterns(columns, sampleRows);
      }

      // Update session with analysis result
      session.analysis_result = analysisResult;
      session.status = ImportSessionStatus.ANALYZED;
      await this.sessionRepository.save(session);

      // Apply mappings to items
      await this.applyMappingsToItems(sessionId, analysisResult.column_mapping);

      this.logger.log(`Analysis complete for session ${sessionId}`);

      return session;
    } catch (error) {
      session.status = ImportSessionStatus.FAILED;
      session.error_message = (error as Error).message;
      await this.sessionRepository.save(session);
      throw error;
    }
  }

  /**
   * Analyze columns using OpenAI
   */
  private async analyzeWithOpenAI(
    columns: string[],
    sampleRows: RawImportRow[],
  ): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(columns, sampleRows);

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a product data analyst. Analyze import file columns and map them to a product schema.
Return JSON with:
- column_mapping: array of { source_column, target_field, confidence (0-1), transformation (optional) }
- suggestions: array of helpful suggestions for the user
- warnings: array of potential issues found

Target schema fields:
${JSON.stringify(PRODUCT_SCHEMA, null, 2)}

Important rules:
1. SKU/article is critical for matching existing products
2. Price should be converted to minor units (cents) if in major units
3. Map to the most specific field possible
4. confidence should reflect how certain you are about the mapping
5. Include transformation instructions if data needs conversion`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(response);

    return {
      detected_columns: columns,
      column_mapping: parsed.column_mapping || [],
      suggestions: parsed.suggestions || [],
      warnings: parsed.warnings || [],
      sample_data: sampleRows.slice(0, 5),
    };
  }

  /**
   * Build prompt for OpenAI analysis
   */
  private buildAnalysisPrompt(columns: string[], sampleRows: RawImportRow[]): string {
    return `Analyze these columns and sample data from a product import file:

Columns: ${JSON.stringify(columns)}

Sample data (first 5 rows):
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Please map each source column to the appropriate target field in our product schema.
Consider column names in multiple languages (English, Russian).
Identify any data quality issues or missing required fields.`;
  }

  /**
   * Fallback analysis using regex patterns
   */
  private analyzeWithPatterns(columns: string[], sampleRows: RawImportRow[]): AnalysisResult {
    const mappings: ColumnMapping[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const mappedColumns = new Set<string>();

    // Try to match each column to a target field
    for (const column of columns) {
      for (const [targetField, patterns] of Object.entries(COLUMN_PATTERNS)) {
        if (mappedColumns.has(column)) continue;

        for (const pattern of patterns) {
          if (pattern.test(column)) {
            mappings.push({
              source_column: column,
              target_field: targetField,
              confidence: 0.8,
            });
            mappedColumns.add(column);
            break;
          }
        }
      }
    }

    // Check for unmapped columns
    const unmappedColumns = columns.filter((c) => !mappedColumns.has(c));
    if (unmappedColumns.length > 0) {
      warnings.push(
        `Unmapped columns: ${unmappedColumns.join(', ')}. Please review and map manually.`,
      );
    }

    // Check for required fields
    const hasSku = mappings.some((m) => m.target_field === 'variant.sku');
    const hasTitle = mappings.some((m) => m.target_field === 'product.title');
    const hasPrice = mappings.some(
      (m) =>
        m.target_field === 'product.base_price_minor' || m.target_field === 'variant.price_minor',
    );

    if (!hasSku) {
      warnings.push('No SKU column detected. SKU is recommended for matching existing products.');
    }
    if (!hasTitle) {
      warnings.push('No product title column detected. Title is required.');
    }
    if (!hasPrice) {
      warnings.push('No price column detected. Price is recommended.');
    }

    // Suggestions
    if (mappings.length > 0) {
      suggestions.push(
        `${mappings.length} columns were automatically mapped. Review the mappings before proceeding.`,
      );
    }

    // Analyze sample data for price format
    const priceMapping = mappings.find(
      (m) =>
        m.target_field === 'product.base_price_minor' || m.target_field === 'variant.price_minor',
    );
    if (priceMapping && sampleRows.length > 0) {
      const sourceColumn = priceMapping.source_column.toLowerCase();
      // If source column already contains 'minor', prices are already in minor units
      const isAlreadyMinor = sourceColumn.includes('minor');

      if (!isAlreadyMinor) {
        const samplePrice = sampleRows[0][priceMapping.source_column];
        // Only convert if price looks like major units (has decimal or is small number)
        if (samplePrice && (samplePrice.includes('.') || parseInt(samplePrice) < 10000)) {
          suggestions.push(
            'Prices appear to be in major units. They will be converted to minor units (multiplied by 100).',
          );
          priceMapping.transformation = 'multiply_by_100';
        }
      }
    }

    return {
      detected_columns: columns,
      column_mapping: mappings,
      suggestions,
      warnings,
      sample_data: sampleRows.slice(0, 5),
    };
  }

  /**
   * Apply column mappings to import items
   */
  private async applyMappingsToItems(sessionId: string, mappings: ColumnMapping[]): Promise<void> {
    const items = await this.itemRepository.find({
      where: { session_id: sessionId },
    });

    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      for (const item of batch) {
        const mappedData = this.mapRowToProduct(item.raw_data, mappings);
        item.mapped_data = mappedData;

        // Determine initial status based on data quality
        if (this.hasRequiredFields(mappedData)) {
          item.status = ImportItemStatus.NEW;
          item.action = ImportItemAction.INSERT;
        } else {
          item.status = ImportItemStatus.PENDING;
          item.action = ImportItemAction.SKIP;
          item.validation_errors = this.getValidationErrors(mappedData);
        }
      }

      await this.itemRepository.save(batch);
    }

    this.logger.log(`Applied mappings to ${items.length} items`);
  }

  /**
   * Map raw row data to product structure
   */
  private mapRowToProduct(rawData: RawImportRow, mappings: ColumnMapping[]): MappedProductData {
    const result: MappedProductData = {
      product: {},
      variant: {},
    };

    for (const mapping of mappings) {
      const value = rawData[mapping.source_column];
      if (value === undefined || value === '') continue;

      // Apply transformation if specified
      let transformedValue: any = value;
      if (mapping.transformation === 'multiply_by_100') {
        const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(numValue)) {
          transformedValue = Math.round(numValue * 100);
        }
      }

      // Parse target field path
      const [section, field] = mapping.target_field.split('.');

      // Parse JSON arrays for specific fields
      const jsonArrayFields = ['images', 'tags', 'category', 'attrs'];
      if (jsonArrayFields.includes(field) && typeof value === 'string') {
        try {
          // Try parsing as JSON array
          if (value.startsWith('[')) {
            transformedValue = JSON.parse(value);
          }
        } catch {
          // Keep as string if parsing fails
        }
      }
      if (section === 'product') {
        result.product[field] = transformedValue;
      } else if (section === 'variant') {
        result.variant[field] = transformedValue;
      }
    }

    return result;
  }

  /**
   * Check if mapped data has required fields
   */
  private hasRequiredFields(mappedData: MappedProductData): boolean {
    return !!(mappedData.product.title || mappedData.variant.sku);
  }

  /**
   * Get validation errors for mapped data
   */
  private getValidationErrors(mappedData: MappedProductData): string[] {
    const errors: string[] = [];

    if (!mappedData.product.title && !mappedData.variant.sku) {
      errors.push('Missing required field: title or SKU');
    }

    return errors;
  }

  /**
   * Update column mapping for a session
   */
  async updateColumnMapping(
    sessionId: string,
    merchantId: string,
    newMappings: ColumnMapping[],
  ): Promise<ImportSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, merchant_id: merchantId },
    });

    if (!session) {
      throw new Error('Import session not found');
    }

    // Update analysis result with new mappings
    session.analysis_result = {
      ...session.analysis_result,
      column_mapping: newMappings,
    };
    await this.sessionRepository.save(session);

    // Re-apply mappings to items
    await this.applyMappingsToItems(sessionId, newMappings);

    return session;
  }
}
