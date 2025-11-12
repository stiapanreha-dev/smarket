import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiExcludeEndpoint } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiExcludeEndpoint() // Hide from Swagger docs for security
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    await this.webhookService.processWebhook('stripe', payload, signature);

    return { received: true };
  }

  @Post('yookassa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'YooKassa webhook endpoint' })
  @ApiExcludeEndpoint()
  async handleYooKassaWebhook(
    @Body() payload: any,
    @Headers('authorization') authorization: string,
  ): Promise<{ received: boolean }> {
    // YooKassa sends authorization header
    await this.webhookService.processWebhook('yookassa', payload, authorization || '');

    return { received: true };
  }

  @Post('network-intl')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Network International webhook endpoint' })
  @ApiExcludeEndpoint()
  async handleNetworkIntlWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing x-signature header');
    }

    await this.webhookService.processWebhook('network_intl', payload, signature);

    return { received: true };
  }
}
