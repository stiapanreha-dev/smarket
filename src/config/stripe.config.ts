/**
 * Stripe Configuration
 *
 * Configuration for Stripe payment processing
 */

export const stripeConfig = {
  /**
   * Stripe Secret Key (from environment variables)
   * Get from https://dashboard.stripe.com/test/apikeys
   */
  secretKey: process.env.STRIPE_SECRET_KEY || '',

  /**
   * Stripe API Version
   */
  apiVersion: '2024-11-20.acacia' as const,

  /**
   * Webhook Secret (for Stripe webhook signature verification)
   */
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  /**
   * Currency (default)
   */
  defaultCurrency: 'usd',

  /**
   * Payment method types enabled
   */
  paymentMethodTypes: ['card'] as const,
};

export default stripeConfig;
