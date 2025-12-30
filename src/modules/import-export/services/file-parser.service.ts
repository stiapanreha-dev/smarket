import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  IFileParser,
  ParseResult,
  ParseOptions,
  RawImportRow,
} from '../parsers/base-parser.interface';
import { CsvParser } from '../parsers/csv.parser';
import { ExcelParser } from '../parsers/excel.parser';
import { YmlParser } from '../parsers/yml.parser';
import { JsonParser } from '../parsers/json.parser';
import { ImportFileFormat } from '@database/entities/import-session.entity';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);
  private readonly parsers: IFileParser[];

  constructor() {
    // Initialize all parsers
    this.parsers = [new CsvParser(), new ExcelParser(), new YmlParser(), new JsonParser()];
  }

  /**
   * Parse file and return normalized rows
   */
  async parseFile(buffer: Buffer, filename: string, options?: ParseOptions): Promise<ParseResult> {
    const parser = this.getParser(filename);

    if (!parser) {
      const ext = this.getExtension(filename);
      throw new BadRequestException(
        `Unsupported file format: ${ext}. Supported formats: CSV, XLSX, XLS, YML, XML, JSON`,
      );
    }

    this.logger.log(`Parsing file ${filename} with ${parser.constructor.name}`);

    try {
      const result = await parser.parse(buffer, options);

      this.logger.log(`Parsed ${result.rows.length} rows with ${result.columns.length} columns`);

      return result;
    } catch (error) {
      this.logger.error(`Error parsing file ${filename}:`, error);
      throw new BadRequestException(`Failed to parse file: ${(error as Error).message}`);
    }
  }

  /**
   * Detect file format from filename
   */
  detectFileFormat(filename: string): ImportFileFormat {
    const ext = this.getExtension(filename).toLowerCase();

    switch (ext) {
      case 'csv':
      case 'tsv':
        return ImportFileFormat.CSV;
      case 'xlsx':
        return ImportFileFormat.XLSX;
      case 'xls':
        return ImportFileFormat.XLS;
      case 'yml':
        return ImportFileFormat.YML;
      case 'xml':
        return ImportFileFormat.XML;
      case 'json':
        return ImportFileFormat.JSON;
      default:
        throw new BadRequestException(`Unsupported file format: .${ext}`);
    }
  }

  /**
   * Get parser for file
   */
  private getParser(filename: string, mimeType?: string): IFileParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(filename, mimeType)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Get file extension from filename
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  /**
   * Get sample rows for preview
   */
  async getSampleRows(
    buffer: Buffer,
    filename: string,
    maxRows: number = 5,
  ): Promise<RawImportRow[]> {
    const result = await this.parseFile(buffer, filename, { maxRows });
    return result.rows;
  }

  /**
   * Validate file before full parsing
   */
  async validateFile(
    buffer: Buffer,
    filename: string,
  ): Promise<{
    valid: boolean;
    format: ImportFileFormat;
    columns: string[];
    rowCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const format = this.detectFileFormat(filename);
      const result = await this.parseFile(buffer, filename, { maxRows: 100 });

      // Basic validation
      if (result.rows.length === 0) {
        errors.push('File contains no data rows');
      }

      if (result.columns.length === 0) {
        errors.push('File contains no columns');
      }

      return {
        valid: errors.length === 0,
        format,
        columns: result.columns,
        rowCount: result.rows.length,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        format: ImportFileFormat.CSV, // Default
        columns: [],
        rowCount: 0,
        errors: [(error as Error).message],
      };
    }
  }
}
