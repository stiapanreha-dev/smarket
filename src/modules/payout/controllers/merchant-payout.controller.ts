import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PayoutService } from '../services/payout.service';
import { PayoutResponseDto } from '../dto/payout-response.dto';
import { BalanceResponseDto } from '../dto/balance-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSplit } from '../../../database/entities/payment-split.entity';
import { Merchant } from '../../../database/entities/merchant.entity';

@Controller('api/v1/merchant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantPayoutController {
  constructor(
    private readonly payoutService: PayoutService,
    @InjectRepository(PaymentSplit)
    private readonly splitRepository: Repository<PaymentSplit>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Get merchant balance
   * GET /api/v1/merchant/balance
   */
  @Get('balance')
  @Roles('merchant', 'admin')
  @HttpCode(HttpStatus.OK)
  async getBalance(@Request() req): Promise<BalanceResponseDto> {
    const userId = req.user.id;

    // Get merchant for user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new Error('Merchant not found for user');
    }

    const balance = await this.payoutService.calculateMerchantBalance(
      merchant.id,
    );

    return BalanceResponseDto.create(balance);
  }

  /**
   * Get merchant payouts
   * GET /api/v1/merchant/payouts
   */
  @Get('payouts')
  @Roles('merchant', 'admin')
  @HttpCode(HttpStatus.OK)
  async getPayouts(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ): Promise<{
    payouts: PayoutResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const userId = req.user.id;

    // Get merchant for user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new Error('Merchant not found for user');
    }

    const { payouts, total } = await this.payoutService.getMerchantPayouts(
      merchant.id,
      {
        status: status as any,
        limit: Math.min(limit, 100), // Max 100
        offset,
      },
    );

    return {
      payouts: payouts.map(PayoutResponseDto.fromEntity),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get payout by ID
   * GET /api/v1/merchant/payouts/:id
   */
  @Get('payouts/:id')
  @Roles('merchant', 'admin')
  @HttpCode(HttpStatus.OK)
  async getPayout(
    @Request() req,
    @Param('id') payoutId: string,
  ): Promise<PayoutResponseDto> {
    const userId = req.user.id;

    // Get merchant for user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new Error('Merchant not found for user');
    }

    const payout = await this.payoutService.getPayout(payoutId);

    // Verify payout belongs to merchant
    if (payout.merchant_id !== merchant.id) {
      throw new Error('Payout not found');
    }

    return PayoutResponseDto.fromEntity(payout);
  }

  /**
   * Get merchant transactions (payment splits)
   * GET /api/v1/merchant/transactions
   */
  @Get('transactions')
  @Roles('merchant', 'admin')
  @HttpCode(HttpStatus.OK)
  async getTransactions(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ): Promise<{
    transactions: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const userId = req.user.id;

    // Get merchant for user
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new Error('Merchant not found for user');
    }

    const qb = this.splitRepository
      .createQueryBuilder('split')
      .leftJoinAndSelect('split.payment', 'payment')
      .where('split.merchant_id = :merchantId', { merchantId: merchant.id })
      .orderBy('split.created_at', 'DESC');

    if (status) {
      qb.andWhere('split.status = :status', { status });
    }

    const total = await qb.getCount();

    const splits = await qb
      .limit(Math.min(limit, 100))
      .offset(offset)
      .getMany();

    const transactions = splits.map((split) => ({
      id: split.id,
      paymentId: split.payment_id,
      grossAmount: split.gross_amount,
      platformFee: split.platform_fee,
      processingFee: split.processing_fee,
      netAmount: split.net_amount,
      currency: split.currency,
      status: split.status,
      payoutId: split.payout_id,
      escrowReleaseDate: split.escrow_release_date,
      escrowReleased: split.escrow_released,
      createdAt: split.created_at,
    }));

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }
}
