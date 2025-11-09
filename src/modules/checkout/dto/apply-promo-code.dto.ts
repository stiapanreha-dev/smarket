import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyPromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
