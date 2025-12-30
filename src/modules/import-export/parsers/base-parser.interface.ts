/**
 * Raw import row - normalized format for all file types
 * All values are converted to strings
 */
export type RawImportRow = Record<string, string>;

/**
 * Result of parsing a file
 */
export interface ParseResult {
  rows: RawImportRow[];
  columns: string[];
  metadata?: {
    encoding?: string;
    delimiter?: string;
    sheetName?: string;
    [key: string]: any;
  };
}

/**
 * Interface for file parsers
 */
export interface IFileParser {
  /**
   * Supported file extensions
   */
  supportedExtensions: string[];

  /**
   * Parse file buffer and return normalized rows
   */
  parse(buffer: Buffer, options?: ParseOptions): Promise<ParseResult>;

  /**
   * Check if this parser can handle the given file
   */
  canParse(filename: string, mimeType?: string): boolean;
}

/**
 * Options for parsing
 */
export interface ParseOptions {
  /**
   * For CSV: delimiter character
   */
  delimiter?: string;

  /**
   * For Excel: sheet name or index
   */
  sheet?: string | number;

  /**
   * For Excel: row number containing headers (0-indexed)
   */
  headerRow?: number;

  /**
   * Maximum number of rows to parse (for preview)
   */
  maxRows?: number;

  /**
   * Encoding for CSV files
   */
  encoding?: BufferEncoding;
}
