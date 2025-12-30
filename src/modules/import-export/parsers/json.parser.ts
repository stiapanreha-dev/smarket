import { IFileParser, ParseResult, ParseOptions, RawImportRow } from './base-parser.interface';

export class JsonParser implements IFileParser {
  supportedExtensions = ['.json'];

  canParse(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    if (this.supportedExtensions.includes(`.${ext}`)) {
      return true;
    }
    if (mimeType) {
      return mimeType.includes('json');
    }
    return false;
  }

  async parse(buffer: Buffer, options?: ParseOptions): Promise<ParseResult> {
    const encoding = options?.encoding || 'utf-8';
    const content = buffer.toString(encoding);

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }

    // Ensure we have an array
    let rows: any[];
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (parsed.products && Array.isArray(parsed.products)) {
      // Common pattern: { products: [...] }
      rows = parsed.products;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      // Common pattern: { items: [...] }
      rows = parsed.items;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      // Common pattern: { data: [...] }
      rows = parsed.data;
    } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Single object, wrap in array
      rows = [parsed];
    } else {
      throw new Error('JSON must be an array of objects or contain products/items/data array');
    }

    // Limit rows if specified
    if (options?.maxRows) {
      rows = rows.slice(0, options.maxRows);
    }

    // Normalize all values to strings
    const normalizedRows = rows.map((row) => this.normalizeRow(row));

    // Get columns from first row
    const columns = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : [];

    return {
      rows: normalizedRows,
      columns,
      metadata: {
        encoding,
        originalStructure: Array.isArray(parsed) ? 'array' : 'object',
      },
    };
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
        normalized[key] = String(value);
      }
    }

    return normalized;
  }
}
