import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  getModuleInfo(): string {
    return 'Notification Module - Manages email, SMS, and push notifications';
  }
}
