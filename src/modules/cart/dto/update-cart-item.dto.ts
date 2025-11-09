import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for the cart item',
    example: 2,
    minimum: 0,
    maximum: 99,
  })
  @IsNumber()
  @Min(0)
  @Max(99)
  quantity: number;
}
