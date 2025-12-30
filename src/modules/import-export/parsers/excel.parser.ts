import * as XLSX from 'xlsx';
import { IFileParser, ParseResult, ParseOptions, RawImportRow } from './base-parser.interface';

export class ExcelParser implements IFileParser {
  supportedExtensions = ['.xlsx', '.xls'];

  canParse(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    if (this.supportedExtensions.includes(`.${ext}`)) {
      return true;
    }
    if (mimeType) {
      return (
        mimeType.includes('spreadsheet') ||
        mimeType.includes('excel') ||
        mimeType.includes('ms-excel')
      );
    }
    return false;
  }

  async parse(buffer: Buffer, options?: ParseOptions): Promise<ParseResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get sheet (by name, index, or first sheet)
    let sheetName: string;
    if (typeof options?.sheet === 'string') {
      sheetName = options.sheet;
    } else if (typeof options?.sheet === 'number') {
      sheetName = workbook.SheetNames[options.sheet] || workbook.SheetNames[0];
    } else {
      sheetName = workbook.SheetNames[0];
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    // Convert to JSON with headers
    const headerRow = options?.headerRow ?? 0;
    const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
      header: headerRow === 0 ? undefined : 1,
      defval: '',
      raw: false, // Convert all values to strings
    });

    // Limit rows if specified
    const rows = options?.maxRows ? jsonData.slice(0, options.maxRows) : jsonData;

    // Normalize all values to strings
    const normalizedRows = rows.map((row) => this.normalizeRow(row));

    // Get columns from first row
    const columns = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : [];

    return {
      rows: normalizedRows,
      columns,
      metadata: {
        sheetName,
        totalSheets: workbook.SheetNames.length,
        allSheets: workbook.SheetNames,
      },
    };
  }

  private normalizeRow(row: Record<string, any>): RawImportRow {
    const normalized: RawImportRow = {};

    for (const [key, value] of Object.entries(row)) {
      // Skip internal XLSX properties
      if (key.startsWith('__')) continue;

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
