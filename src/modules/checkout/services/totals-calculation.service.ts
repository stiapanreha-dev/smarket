import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../common/services/cache.service';
import { SettingsService } from '../../settings/settings.service';
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

  constructor(
    private readonly cacheService: CacheService,
    private readonly settingsService: SettingsService,
  ) {}

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

    // 2. Get VAT settings
    const vatSettings = await this.settingsService.getVatSettings();
    const vatMode = vatSettings.mode;

    // 3. Calculate tax based on shipping address and VAT mode
    const taxDetails = shippingAddress
      ? await this.calculateTax(subtotal, shippingAddress, currency, vatMode)
      : { rate: 0, amount: 0, jurisdiction: 'N/A' };

    // 4. Calculate shipping cost
    const shippingAmount = shippingAddress
      ? await this.calculateShipping(items, shippingAddress, currency)
      : 0;

    // 5. Calculate discounts from promo codes
    const discountAmount = promoCodes ? this.calculateDiscount(subtotal, promoCodes) : 0;

    // 6. Calculate total based on VAT mode
    let totalAmount: number;
    if (vatMode === 'included') {
      // VAT is already included in prices - don't add tax to total
      totalAmount = subtotal + shippingAmount - discountAmount;
    } else {
      // VAT is added on top of prices
      totalAmount = subtotal + taxDetails.amount + shippingAmount - discountAmount;
    }

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
   * Calculate tax based on shipping address and VAT mode
   * Uses cached tax rates by region for performance
   *
   * @param subtotal - The order subtotal in minor units
   * @param address - Shipping address for tax jurisdiction
   * @param currency - Currency code
   * @param vatMode - 'included' or 'on_top'
   */
  private async calculateTax(
    subtotal: number,
    address: Address,
    currency: string,
    vatMode: 'included' | 'on_top' = 'on_top',
  ): Promise<{ rate: number; amount: number; jurisdiction: string }> {
    const cacheKey = `tax:rate:${address.country}:${address.state || 'N/A'}:${currency}`;

    // Try to get from cache
    const cachedRate = await this.cacheService.get<TaxRate>(cacheKey);
    let taxRate: TaxRate;

    if (cachedRate) {
      this.logger.debug(`Tax rate cache hit for ${cacheKey}`);
      taxRate = cachedRate;
    } else {
      // Calculate tax rate based on jurisdiction using settings
      taxRate = await this.getTaxRate(address);

      // Cache the rate
      await this.cacheService.set(cacheKey, taxRate, this.TAX_CACHE_TTL);
    }

    // Calculate tax amount based on VAT mode
    let taxAmount: number;
    if (vatMode === 'included') {
      // VAT is included in price: extract VAT from subtotal
      // Formula: VAT = subtotal - subtotal / (1 + rate/100)
      // Example: price 1220, rate 22% -> VAT = 1220 - 1220/1.22 = 1220 - 1000 = 220
      taxAmount = Math.round(subtotal - subtotal / (1 + taxRate.rate / 100));
    } else {
      // VAT is on top: add VAT to subtotal
      // Formula: VAT = subtotal * rate / 100
      taxAmount = Math.round((subtotal * taxRate.rate) / 100);
    }

    return {
      rate: taxRate.rate,
      amount: taxAmount,
      jurisdiction: taxRate.jurisdiction,
    };
  }

  /**
   * Get tax rate for a specific address using platform settings
   * Falls back to hardcoded US state rates for sales tax support
   */
  private async getTaxRate(address: Address): Promise<TaxRate> {
    // Get VAT settings from database
    const vatSettings = await this.settingsService.getVatSettings();

    // Special handling for US - they have state-level sales tax
    // which differs from VAT and is typically added on top
    if (address.country === 'US') {
      const usStateRates: Record<string, number> = {
        CA: 7.25, // California
        NY: 4.0, // New York
        TX: 6.25, // Texas
        FL: 6.0, // Florida
      };
      const rate = address.state
        ? usStateRates[address.state] || vatSettings.country_rates['US'] || 0
        : vatSettings.country_rates['US'] || 0;

      return {
        rate,
        jurisdiction: address.state ? `${address.country}-${address.state}` : address.country,
      };
    }

    // For other countries, use settings from database
    const countryRate = vatSettings.country_rates[address.country];
    const rate = countryRate !== undefined ? countryRate : vatSettings.default_rate;

    return {
      rate,
      jurisdiction: address.country,
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
