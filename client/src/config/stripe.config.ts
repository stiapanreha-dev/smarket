/**
 * Stripe Configuration
 *
 * Configuration for Stripe integration
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Get Stripe publishable key from environment variables
 */
function getStripePublishableKey(): string {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    console.warn(
      'VITE_STRIPE_PUBLISHABLE_KEY is not set. Please add it to your .env file.\n' +
      'Get your key from: https://dashboard.stripe.com/test/apikeys'
    );
    // Return a default test key for development to prevent errors
    // This key won't work but allows the app to load
    return 'pk_test_placeholder';
  }

  return key;
}

/**
 * Stripe publishable key
 */
export const STRIPE_PUBLISHABLE_KEY = getStripePublishableKey();

/**
 * Stripe promise (singleton)
 * This ensures Stripe.js is only loaded once
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
