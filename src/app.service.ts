import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo(): object {
    return {
      name: 'SnailMarketplace API',
      version: '1.0.0',
      description: 'Modular monolith marketplace platform',
      endpoints: {
        health: '/health',
        api: '/api/v1',
      },
    };
  }
}
