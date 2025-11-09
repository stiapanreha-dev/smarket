import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsOptional()
  @IsString()
  sessionId?: string; // For guest checkout

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
