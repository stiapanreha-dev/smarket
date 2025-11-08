import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getModuleInfo(): string {
    return 'Auth Module - Handles authentication and authorization';
  }
}
