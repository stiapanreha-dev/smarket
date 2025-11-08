import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getModuleInfo(): string {
    return 'User Module - Manages user profiles and accounts';
  }
}
