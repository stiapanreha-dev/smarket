import { XMLParser } from 'fast-xml-parser';
import { IFileParser, ParseResult, ParseOptions, RawImportRow } from './base-parser.interface';

/**
 * Parser for Yandex Market Language (YML) format
 * @see https://yandex.ru/support/partnermarket/export/yml.html
 */
export class YmlParser implements IFileParser {
  supportedExtensions = ['.yml', '.xml'];

  canParse(filename: string, mimeType?: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    if (this.supportedExtensions.includes(`.${ext}`)) {
      return true;
    }
    if (mimeType) {
      return mimeType.includes('xml') || mimeType.includes('yml');
    }
    return false;
  }

  async parse(buffer: Buffer, options?: ParseOptions): Promise<ParseResult> {
    const content = buffer.toString('utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(content);

    // Navigate to offers in YML structure
    // YML structure: yml_catalog > shop > offers > offer[]
    const offers = this.extractOffers(parsed);

    // Limit rows if specified
    const limitedOffers = options?.maxRows ? offers.slice(0, options.maxRows) : offers;

    // Convert offers to normalized rows
    const normalizedRows = limitedOffers.map((offer: any) => this.normalizeOffer(offer));

    // Get columns from first row
    const columns = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : [];

    // Extract categories for mapping
    const categories = this.extractCategories(parsed);

    return {
      rows: normalizedRows,
      columns,
      metadata: {
        format: 'yml',
        categories,
        shopName: this.extractShopName(parsed),
      },
    };
  }

  private extractOffers(parsed: any): any[] {
    // Try different YML structures
    const possiblePaths = [
      parsed?.yml_catalog?.shop?.offers?.offer,
      parsed?.yml_catalog?.offers?.offer,
      parsed?.catalog?.shop?.offers?.offer,
      parsed?.shop?.offers?.offer,
      parsed?.offers?.offer,
    ];

    for (const offers of possiblePaths) {
      if (offers) {
        return Array.isArray(offers) ? offers : [offers];
      }
    }

    return [];
  }

  private extractCategories(parsed: any): Record<string, string> {
    const categories: Record<string, string> = {};

    const possiblePaths = [
      parsed?.yml_catalog?.shop?.categories?.category,
      parsed?.catalog?.shop?.categories?.category,
      parsed?.shop?.categories?.category,
    ];

    for (const categoryList of possiblePaths) {
      if (categoryList) {
        const cats = Array.isArray(categoryList) ? categoryList : [categoryList];
        for (const cat of cats) {
          const id = cat['@_id'] || cat.id;
          const name = cat['#text'] || cat.name || cat;
          if (id) {
            categories[String(id)] = String(name);
          }
        }
        break;
      }
    }

    return categories;
  }

  private extractShopName(parsed: any): string | null {
    return (
      parsed?.yml_catalog?.shop?.name || parsed?.catalog?.shop?.name || parsed?.shop?.name || null
    );
  }

  private normalizeOffer(offer: any): RawImportRow {
    const normalized: RawImportRow = {};

    // Standard YML fields mapping
    const fieldMappings: Record<string, string[]> = {
      id: ['@_id', 'id'],
      name: ['name', 'model', 'typePrefix'],
      price: ['price'],
      oldprice: ['oldprice'],
      currencyId: ['currencyId'],
      categoryId: ['categoryId'],
      picture: ['picture'],
      url: ['url'],
      vendor: ['vendor'],
      vendorCode: ['vendorCode'],
      description: ['description'],
      barcode: ['barcode'],
      weight: ['weight'],
      dimensions: ['dimensions'],
      param: ['param'],
    };

    for (const [normalizedKey, possibleKeys] of Object.entries(fieldMappings)) {
      for (const key of possibleKeys) {
        if (offer[key] !== undefined) {
          const value = offer[key];

          // Handle arrays (e.g., multiple pictures)
          if (Array.isArray(value)) {
            if (normalizedKey === 'param') {
              // Handle YML params as key-value pairs
              const params: Record<string, string> = {};
              for (const p of value) {
                const paramName = p['@_name'] || p.name;
                const paramValue = p['#text'] || p.value || p;
                if (paramName) {
                  params[paramName] = String(paramValue);
                }
              }
              normalized[normalizedKey] = JSON.stringify(params);
            } else {
              normalized[normalizedKey] = JSON.stringify(value);
            }
          } else if (typeof value === 'object') {
            // Handle param as single object
            if (normalizedKey === 'param') {
              const paramName = value['@_name'] || value.name;
              const paramValue = value['#text'] || value.value || '';
              normalized[normalizedKey] = JSON.stringify({ [paramName]: paramValue });
            } else {
              normalized[normalizedKey] = JSON.stringify(value);
            }
          } else {
            normalized[normalizedKey] = String(value).trim();
          }
          break;
        }
      }
    }

    // Handle available attribute
    if (offer['@_available'] !== undefined) {
      normalized['available'] = String(offer['@_available']);
    }

    // Handle type attribute
    if (offer['@_type'] !== undefined) {
      normalized['type'] = String(offer['@_type']);
    }

    return normalized;
  }
}
