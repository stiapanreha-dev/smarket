import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../common/services/cache.service';
import {
  CartItemSnapshot,
  Address,
  CheckoutTotals,
  PromoCodeApplication,
} from '../../../database/entities/checkout-session.entity';

interface TaxRate {
  rate: number; // Percentage (e.g., 20 for 20%)
  jurisdiction: string;
}

interface ShippingRate {
  amount: number; // In minor units
  carrier?: string;
  estimated_days?: number;
}

interface PromoCode {
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number; // Percentage or amount in minor units
  minimum_purchase?: number;
  maximum_discount?: number;
  valid_from: Date;
  valid_until: Date;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
}

@Injectable()
export class TotalsCalculationService {
  private readonly logger = new Logger(TotalsCalculationService.name);
  private readonly TAX_CACHE_TTL = 24 * 60 * 60; // 24 hours

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Calculate complete checkout totals
   */
  async calculateTotals(
    items: CartItemSnapshot[],
    shippingAddress?: Address,
    promoCodes?: PromoCodeApplication[],
    currency = 'USD',
  ): Promise<CheckoutTotals> {
    // 1. Calculate subtotal
    const subtotal = this.calculateSubtotal(items);

    // 2. Calculate tax based on shipping address
    const taxDetails = shippingAddress
      ? await this.calculateTax(subtotal, shippingAddress, currency)
      : { rate: 0, amount: 0, jurisdiction: 'N/A' };

    // 3. Calculate shipping cost
    const shippingAmount = shippingAddress
      ? await this.calculateShipping(items, shippingAddress, currency)
      : 0;

    // 4. Calculate discounts from promo codes
    const discountAmount = promoCodes ? this.calculateDiscount(subtotal, promoCodes) : 0;

    // 5. Calculate total
    const totalAmount = subtotal + taxDetails.amount + shippingAmount - discountAmount;

    return {
      subtotal,
      tax_amount: taxDetails.amount,
      shipping_amount: shippingAmount,
      discount_amount: discountAmount,
      total_amount: Math.max(0, totalAmount), // Ensure non-negative
      currency,
      tax_rate: taxDetails.rate,
      tax_details: [taxDetails],
    };
  }

  /**
   * Calculate subtotal from cart items
   */
  private calculateSubtotal(items: CartItemSnapshot[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Calculate tax based on shipping address
   * Uses cached tax rates by region for performance
   */
  private async calculateTax(
    subtotal: number,
    address: Address,
    currency: string,
  ): Promise<{ rate: number; amount: number; jurisdiction: string }> {
    const cacheKey = `tax:rate:${address.country}:${address.state || 'N/A'}:${currency}`;

    // Try to get from cache
    const cachedRate = await this.cacheService.get<TaxRate>(cacheKey);
    if (cachedRate) {
      this.logger.debug(`Tax rate cache hit for ${cacheKey}`);
      return {
        rate: cachedRate.rate,
        amount: Math.round((subtotal * cachedRate.rate) / 100),
        jurisdiction: cachedRate.jurisdiction,
      };
    }

    // Calculate tax rate based on jurisdiction
    const taxRate = this.getTaxRate(address);

    // Cache the rate
    await this.cacheService.set(cacheKey, taxRate, this.TAX_CACHE_TTL);

    return {
      rate: taxRate.rate,
      amount: Math.round((subtotal * taxRate.rate) / 100),
      jurisdiction: taxRate.jurisdiction,
    };
  }

  /**
   * Get tax rate for a specific address
   * In production, this would integrate with a tax service (Avalara, TaxJar, etc.)
   */
  private getTaxRate(address: Address): TaxRate {
    // Simplified tax calculation - in production, use tax service API
    const taxRates: Record<string, Record<string, number>> = {
      US: {
        CA: 7.25, // California
        NY: 4.0, // New York
        TX: 6.25, // Texas
        FL: 6.0, // Florida
        default: 5.0,
      },
      GB: {
        default: 20.0, // VAT
      },
      DE: {
        default: 19.0, // VAT
      },
      RU: {
        default: 20.0, // НДС
      },
      AE: {
        default: 5.0, // VAT
      },
    };

    const countryRates = taxRates[address.country] || { default: 0 };
    const rate = address.state
      ? countryRates[address.state] || countryRates.default || 0
      : countryRates.default || 0;

    return {
      rate,
      jurisdiction: address.state ? `${address.country}-${address.state}` : address.country,
    };
  }

  /**
   * Calculate shipping cost based on items and address
   */
  private async calculateShipping(
    items: CartItemSnapshot[],
    address: Address,
    currency: string,
  ): Promise<number> {
    // Filter only physical items that require shipping
    const physicalItems = items.filter((item) => item.type === 'physical');
    if (physicalItems.length === 0) {
      return 0;
    }

    // Calculate total weight/dimensions (simplified)
    const totalQuantity = physicalItems.reduce((sum, item) => sum + item.quantity, 0);

    // Get shipping rate (in production, integrate with shipping carriers API)
    const shippingRate = await this.getShippingRate(totalQuantity, address, currency);

    return shippingRate.amount;
  }

  /**
   * Get shipping rate
   * In production, integrate with shipping carriers (USPS, FedEx, DHL, etc.)
   */
  private async getShippingRate(
    totalQuantity: number,
    address: Address,
    currency: string,
  ): Promise<ShippingRate> {
    // Simplified shipping calculation
    // In production, call shipping carrier APIs for real-time rates
    const baseRate = currency === 'USD' ? 500 : 400; // $5.00 or equivalent
    const perItemRate = currency === 'USD' ? 100 : 80; // $1.00 per additional item

    const domesticCountries = ['US', 'RU', 'AE', 'GB'];
    const isDomestic = domesticCountries.includes(address.country);
    const multiplier = isDomestic ? 1 : 2.5; // International shipping costs more

    const amount = Math.round((baseRate + (totalQuantity - 1) * perItemRate) * multiplier);

    return {
      amount,
      carrier: 'Standard',
      estimated_days: isDomestic ? 5 : 14,
    };
  }

  /**
   * Calculate discount from promo codes
   */
  private calculateDiscount(subtotal: number, promoCodes: PromoCodeApplication[]): number {
    if (!promoCodes || promoCodes.length === 0) {
      return 0;
    }

    // Sum all discount amounts (already calculated when codes were applied)
    return promoCodes.reduce((sum, promo) => sum + promo.discount_amount, 0);
  }

  /**
   * Validate and apply promo code
   * Returns the discount amount if valid
   */
  async validateAndApplyPromoCode(
    code: string,
    subtotal: number,
    currency: string,
  ): Promise<PromoCodeApplication | null> {
    const promoCode = await this.getPromoCode(code);

    if (!promoCode) {
      this.logger.warn(`Promo code not found: ${code}`);
      return null;
    }

    // Validate promo code
    if (!promoCode.is_active) {
      this.logger.warn(`Promo code inactive: ${code}`);
      return null;
    }

    const now = new Date();
    if (now < promoCode.valid_from || now > promoCode.valid_until) {
      this.logger.warn(`Promo code expired or not yet valid: ${code}`);
      return null;
    }

    if (promoCode.usage_limit && promoCode.usage_count >= promoCode.usage_limit) {
      this.logger.warn(`Promo code usage limit exceeded: ${code}`);
      return null;
    }

    if (promoCode.minimum_purchase && subtotal < promoCode.minimum_purchase) {
      this.logger.warn(`Subtotal ${subtotal} below minimum purchase ${promoCode.minimum_purchase}`);
      return null;
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * promoCode.discount_value) / 100);
    } else {
      discountAmount = promoCode.discount_value;
    }

    // Apply maximum discount limit
    if (promoCode.maximum_discount) {
      discountAmount = Math.min(discountAmount, promoCode.maximum_discount);
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      code: promoCode.code,
      discount_amount: discountAmount,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      applied_at: new Date(),
    };
  }

  /**
   * Get promo code details
   * In production, this would query a database table
   */
  private async getPromoCode(code: string): Promise<PromoCode | null> {
    // Mock promo codes for demo
    const promoCodes: Record<string, PromoCode> = {
      SAVE10: {
        code: 'SAVE10',
        discount_type: 'percentage',
        discount_value: 10,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 1000,
        usage_count: 50,
        is_active: true,
      },
      WELCOME20: {
        code: 'WELCOME20',
        discount_type: 'percentage',
        discount_value: 20,
        minimum_purchase: 5000, // $50
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 500,
        usage_count: 100,
        is_active: true,
      },
      FLAT500: {
        code: 'FLAT500',
        discount_type: 'fixed_amount',
        discount_value: 500, // $5
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        is_active: true,
        usage_count: 0,
      },
    };

    return promoCodes[code.toUpperCase()] || null;
  }

  /**
   * Recalculate totals after address or promo code change
   */
  async recalculateTotals(
    currentTotals: CheckoutTotals,
    items: CartItemSnapshot[],
    shippingAddress?: Address,
    promoCodes?: PromoCodeApplication[],
  ): Promise<CheckoutTotals> {
    return this.calculateTotals(items, shippingAddress, promoCodes, currentTotals.currency);
  }
}
