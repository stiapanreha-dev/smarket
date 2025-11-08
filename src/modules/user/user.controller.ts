import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  getInfo(): string {
    return this.userService.getModuleInfo();
  }
}
