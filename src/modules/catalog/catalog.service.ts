import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  getModuleInfo(): string {
    return 'Catalog Module - Manages product catalog and categories';
  }
}
