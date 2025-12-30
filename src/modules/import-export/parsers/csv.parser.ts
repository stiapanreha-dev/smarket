import { parse } from 'csv-parse/sync';
import { IFileParser, ParseResult, ParseOptions, RawImportRow } from './base-parser.interface';

export class CsvParser implements IFileParser {
  supportedExtensions = ['.csv', '.tsv'];

  canParse(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    if (this.supportedExtensions.includes(`.${ext}`)) {
      return true;
    }
    if (mimeType) {
      return mimeType.includes('csv') || mimeType.includes('tab-separated');
    }
    return false;
  }

  async parse(buffer: Buffer, options?: ParseOptions): Promise<ParseResult> {
    const encoding = options?.encoding || 'utf-8';
    const content = buffer.toString(encoding);

    // Detect delimiter
    const delimiter = options?.delimiter || this.detectDelimiter(content);

    const records = parse(content, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: true,
    });

    // Limit rows if specified
    const rows: RawImportRow[] = (
      options?.maxRows ? records.slice(0, options.maxRows) : records
    ) as RawImportRow[];

    // Normalize all values to strings
    const normalizedRows = rows.map((row: Record<string, any>) => this.normalizeRow(row));

    // Get columns from first row or parsed headers
    const columns = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : [];

    return {
      rows: normalizedRows,
      columns,
      metadata: {
        delimiter,
        encoding,
      },
    };
  }

  private detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0] || '';

    // Count occurrences of common delimiters
    const delimiters = [';', ',', '\t', '|'];
    let maxCount = 0;
    let detectedDelimiter = ',';

    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = d;
      }
    }

    return detectedDelimiter;
  }

  private normalizeRow(row: Record<string, any>): RawImportRow {
    const normalized: RawImportRow = {};

    for (const [key, value] of Object.entries(row)) {
      // Convert any value to string, handle null/undefined
      if (value === null || value === undefined) {
        normalized[key] = '';
      } else if (typeof value === 'object') {
        normalized[key] = JSON.stringify(value);
      } else {
        normalized[key] = String(value).trim();
      }
    }

    return normalized;
  }
}
