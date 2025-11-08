import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryService {
  getModuleInfo(): string {
    return 'Inventory Module - Manages product inventory and stock levels';
  }
}
