import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShortDescriptionToProducts1763114133046 implements MigrationInterface {
  name = 'AddShortDescriptionToProducts1763114133046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" DROP CONSTRAINT "FK_product_translations_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_variant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product_id"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_merchant_id"`);
    await queryRunner.query(`ALTER TABLE "merchants" DROP CONSTRAINT "FK_merchants_owner_id"`);
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_wishlist_items_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_wishlist_items_wishlist_id"`,
    );
    await queryRunner.query(`ALTER TABLE "wishlists" DROP CONSTRAINT "FK_wishlists_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_user_addresses_user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "schedules_provider_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "schedules_service_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" DROP CONSTRAINT "FK_0fcf7372ed8c867428d29dfab53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "orders_checkout_session_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_variant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_product_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_merchant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_order_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_cancelled_by_fkey"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_provider_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_customer_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "bookings_order_line_item_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "bookings_service_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "services_provider_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "services_merchant_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_merchant_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_payment_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "refunds_created_by_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "refunds_order_line_item_id_fkey"`,
    );
    await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "refunds_payment_id_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reconciliation_reports" DROP CONSTRAINT "FK_c9352b22e520f3de5dd6f8f77e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_2d6776c4b15328f608f2cd47b0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "order_status_transitions_created_by_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "order_status_transitions_line_item_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "order_status_transitions_order_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_applications" DROP CONSTRAINT "FK_734ceb9b7ad4430965148e0c524"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_product_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_sku"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_product_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_attrs_gin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_price_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_inventory"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_variants_sku_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_product_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_search_gin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_title_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_description_trgm"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_translations_slug_locale"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_images_product_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_images_product_position"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_merchant_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_merchant_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_type_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_attrs_gin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_type_status_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_sales_count"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchants_owner_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchants_kyc_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchants_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchants_kyc_status_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_phone"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wishlist_items_wishlist_id_product_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wishlist_items_wishlist_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wishlist_items_product_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wishlists_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_webhook_events_provider"`);
    await queryRunner.query(`DROP INDEX "public"."idx_webhook_events_processed"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_addresses_user_id_is_default"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_addresses_user_id_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_schedules_service_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_schedules_provider_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_user_id_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_session_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_status_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_checkout_sessions_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_checkout_sessions_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_guest_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_checkout_session"`);
    await queryRunner.query(`DROP INDEX "public"."idx_line_items_order"`);
    await queryRunner.query(`DROP INDEX "public"."idx_line_items_merchant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_line_items_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_line_items_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_line_items_fulfillment"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_service_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_customer_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_provider_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_time_range"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_order_line_item"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_reminders"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_provider_schedule"`);
    await queryRunner.query(`DROP INDEX "public"."idx_services_merchant_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_services_provider_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_services_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_services_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_splits_payment_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_splits_merchant_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_splits_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_splits_escrow"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_order_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_provider_payment_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refunds_payment_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refunds_line_item_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refunds_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_token"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user_id_revoked"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reconciliation_reports_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reconciliation_reports_merchant_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reconciliation_reports_type_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payout_batches_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payout_batches_scheduled_for"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payout_batches_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payouts_merchant_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payouts_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payouts_batch_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payouts_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payouts_merchant_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transitions_order"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transitions_line_item"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transitions_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_aggregate"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_event_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_next_retry"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_dlq_event_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_dlq_aggregate"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_dlq_moved_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_outbox_dlq_reprocessed"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id_is_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchant_applications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_merchant_applications_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_user_id_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_action_created_at"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "order_user_or_guest"`);
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_type_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_quantity_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_unit_price_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "order_line_items_total_price_check"`,
    );
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "chk_booking_time_valid"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "chk_booking_status"`);
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "services_duration_minutes_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "services_buffer_minutes_check"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "services_price_minor_check"`);
    await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "chk_service_status"`);
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_gross_amount_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_platform_fee_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_processing_fee_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "payment_splits_net_amount_check"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_splits" DROP CONSTRAINT "chk_split_calculation"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "payments_amount_minor_check"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "payments_authorized_amount_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "payments_captured_amount_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "payments_refunded_amount_check"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "payments_platform_fee_check"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "chk_payment_amounts"`);
    await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "refunds_amount_minor_check"`);
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "transition_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox" DROP CONSTRAINT "order_outbox_status_check"`,
    );
    await queryRunner.query(`ALTER TABLE "webhook_events" DROP CONSTRAINT "uq_provider_event"`);
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "uq_schedule_service_provider"`,
    );
    await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "uq_booking_slot"`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD "short_description" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "currency" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "merchants" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "merchants" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    await queryRunner.query(`COMMENT ON COLUMN "users"."avatar_url" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "users"."date_of_birth" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "wishlists" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "wishlists" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "webhook_events" ALTER COLUMN "processed" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "webhook_events" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "user_addresses"."country" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "exceptions" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."session_id" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."cart_snapshot" IS NULL`);
    await queryRunner.query(`ALTER TYPE "public"."checkout_step" RENAME TO "checkout_step_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_sessions_step_enum" AS ENUM('cart_review', 'shipping_address', 'delivery_method', 'payment_method', 'order_review', 'payment', 'confirmation')`,
    );
    await queryRunner.query(`ALTER TABLE "checkout_sessions" ALTER COLUMN "step" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "step" TYPE "public"."checkout_sessions_step_enum" USING "step"::"text"::"public"."checkout_sessions_step_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "step" SET DEFAULT 'cart_review'`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_step_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."shipping_address" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."billing_address" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."delivery_method_type" RENAME TO "delivery_method_type_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_sessions_delivery_method_enum" AS ENUM('standard', 'express', 'pickup')`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "delivery_method" TYPE "public"."checkout_sessions_delivery_method_enum" USING "delivery_method"::"text"::"public"."checkout_sessions_delivery_method_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."delivery_method_type_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."delivery_method" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_method_type" RENAME TO "payment_method_type_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_sessions_payment_method_enum" AS ENUM('card', 'apple_pay', 'google_pay', 'bank_transfer', 'paypal', 'crypto', 'cash_on_delivery')`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "payment_method" TYPE "public"."checkout_sessions_payment_method_enum" USING "payment_method"::"text"::"public"."checkout_sessions_payment_method_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_method_type_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."payment_details" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."totals" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."promo_codes" IS NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."checkout_status" RENAME TO "checkout_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_sessions_status_enum" AS ENUM('in_progress', 'completed', 'expired', 'cancelled', 'failed')`,
    );
    await queryRunner.query(`ALTER TABLE "checkout_sessions" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "status" TYPE "public"."checkout_sessions_status_enum" USING "status"::"text"::"public"."checkout_sessions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "status" SET DEFAULT 'in_progress'`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_status_old"`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."idempotency_key" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."order_id" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."order_number" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."error_message" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."metadata" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "checkout_sessions"."expires_at" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded', 'partially_refunded')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_line_items" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."order_line_items_type_enum" AS ENUM('physical', 'digital', 'service')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD "type" "public"."order_line_items_type_enum" NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_line_items" DROP COLUMN "fulfillment_status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."order_line_items_fulfillment_status_enum" AS ENUM('pending', 'processing', 'fulfilled', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD "fulfillment_status" "public"."order_line_items_fulfillment_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "fulfillment_data" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "status_history" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "buffer_minutes" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ALTER COLUMN "escrow_released" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "captured_amount" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "refunded_amount" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "requires_action" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "updated_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "used" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "revoked" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "reconciliation_reports"."merchant_id" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "reconciliation_reports"."type" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "reconciliation_reports"."discrepancies" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "reconciliation_reports"."report_data" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "reconciliation_reports"."generated_by" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "payouts"."splits_included" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "payouts"."processing_fee" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "payouts"."net_amount" IS NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "payouts"."arrived_at" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ALTER COLUMN "metadata" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox" DROP COLUMN "aggregate_type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."order_outbox_aggregate_type_enum" AS ENUM('order', 'order_line_item', 'payment')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox" ADD "aggregate_type" "public"."order_outbox_aggregate_type_enum" NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."order_outbox_status_enum" AS ENUM('pending', 'processing', 'processed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox" ADD "status" "public"."order_outbox_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox" ALTER COLUMN "created_at" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_outbox_dlq" ALTER COLUMN "moved_to_dlq_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox_dlq" ALTER COLUMN "reprocessed" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox_dlq" ALTER COLUMN "metadata" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('ORDER_UPDATE', 'PAYMENT_SUCCESS', 'SHIPPING_UPDATE', 'BOOKING_REMINDER', 'PROMO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."audit_action" RENAME TO "audit_action_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'delete', 'profile_updated', 'email_changed', 'phone_changed', 'password_changed', 'password_reset_requested', 'password_reset_completed', 'email_verified', 'phone_verified', 'login', 'logout', 'failed_login', 'token_refresh', 'all_sessions_revoked', 'account_created', 'account_deleted', 'role_changed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "public"."audit_logs_action_enum" USING "action"::"text"::"public"."audit_logs_action_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."audit_action_old"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(
      `CREATE INDEX "IDX_deee14e1dd1ef09b51502b0d93" ON "product_variants" ("product_id", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_46f236f21640f9da218a063a86" ON "product_variants" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6343513e20e2deab45edfce131" ON "product_variants" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0c1757900275ef9ee6e37cff55" ON "product_translations" ("locale") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_431218829bc5c5ec9230232b96" ON "product_translations" ("product_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f77fd3293d18eba249603c545" ON "product_images" ("product_id", "position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5d3059a2cdc79e4869e4f414e" ON "products" ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38ab7c0f55274f6c11f8886627" ON "products" ("merchant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1846199852a695713b1f8f5e9a" ON "products" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5662d5ea5da62fc54b0f12a46" ON "products" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d80d63e220c4511ab4b659584" ON "products" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84f1d5ba14e3d8ec381d885248" ON "merchants" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be101174daafd5f7af36134081" ON "merchants" ("kyc_status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_932ac199ae3be47144903de1c1" ON "merchants" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f169d18dc7fce81f4c20974fd0" ON "users" ("phone") WHERE phone IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_177397e044732e7e9c0215cd5b" ON "wishlist_items" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_754a9ecec7627d432c2134dd00" ON "wishlist_items" ("wishlist_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9379dc3c7337db43e580df627" ON "wishlist_items" ("wishlist_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b5e6331a1a7d61c25d7a25cab8" ON "wishlists" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_31f02494fefdb995eb8f6ce5dd" ON "webhook_events" ("provider", "provider_event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c2f5f461ca00d421976e458ff" ON "webhook_events" ("processed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c11d22eea73bbc94357f232643" ON "webhook_events" ("provider", "event_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_321b39fa8ba51a1fd268d9cb5e" ON "user_addresses" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_192dfe6815edb6328cc0bd2788" ON "user_addresses" ("user_id", "is_default") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4fc40fa220693bab09b5070d9b" ON "schedules" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ddd03cb28bed3c395141ecc05b" ON "schedules" ("service_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b193fce65f4fb6be5d716fea3" ON "checkout_sessions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2411f08d2fd4c1d7ab68cb949" ON "checkout_sessions" ("status", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b358ba14d305dbce9ff3f709c" ON "checkout_sessions" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f625e45db729e93f76b07bca79" ON "checkout_sessions" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c884e321f927d5b86aac7c8f9e" ON "orders" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_75eba1c6b1a66b09f2a97e6927" ON "orders" ("order_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb77bc746d4e7b50c722fb2151" ON "orders" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4cd6c9158b7552ab3e7be417fa" ON "order_line_items" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_961a9e3df9521bcb98d67cc3d2" ON "order_line_items" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfdda156311b6429147a3e16df" ON "order_line_items" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_297288bf81b5ab6e35c9b68eb5" ON "order_line_items" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a36598d1d2fc06b48a5f61009e" ON "bookings" ("provider_id", "start_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_635f82f17301d3b01132434a4d" ON "bookings" ("start_at", "reminder_sent_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a78b8c5dfec72b48032d70d7c" ON "bookings" ("order_line_item_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48b267d894e32a25ebde4b207a" ON "bookings" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c685a33a322760eb9021b4727e" ON "bookings" ("start_at", "end_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aae90d7b26a7414deb4029ca1b" ON "bookings" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e21b7ae33e7b0673270de4146" ON "bookings" ("customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df22e2beaabc33a432b4f65e3c" ON "bookings" ("service_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfdcce31c9c571f9e5a8226dec" ON "services" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8acaf7b489ffd8187b5cdd504c" ON "services" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7a40b21f8fd548be206fcc89b" ON "services" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f97e70284f7a8d64abc4e713ce" ON "services" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f913cf47397d2e27579f89b73c" ON "payment_splits" ("escrow_released", "escrow_release_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48a3c7b67d4af688d4d38bd308" ON "payment_splits" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b4b4fd73b20e7004f8bcc5322" ON "payment_splits" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2e00cecc72b7a0b0b379f3c83" ON "payment_splits" ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1237daf748b7653a6ebb9492fe" ON "payments" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_66e758f1718149c6d39f94d351" ON "payments" ("provider", "provider_payment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2f7b823a21562eeca20e72b00" ON "payments" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90c78d3c32a3346772edf34e73" ON "refunds" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_501a21bc914fe8de16c06d7c9e" ON "refunds" ("order_line_item_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f48aa5d56c42aeb495db01668" ON "refunds" ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b85ba602ae65eb5813f09e3cec" ON "refresh_tokens" ("user_id", "revoked") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON "refresh_tokens" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe63c1bc3504acc23df15466a1" ON "reconciliation_reports" ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c9352b22e520f3de5dd6f8f77e" ON "reconciliation_reports" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a4c2793f01a45d5df781003f5" ON "reconciliation_reports" ("report_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_40fd46129e1ec4c51938a131d6" ON "payout_batches" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0dec1b56b05f04b1d4b9f8d61" ON "payout_batches" ("scheduled_for") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_829c23d35609f1a49b7b3cd608" ON "payout_batches" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6968bde5ffc81eb965a323eff1" ON "payouts" ("merchant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9840c85686a28883c7889e1527" ON "payouts" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b76e4bddfa2fad64cd9160676" ON "payouts" ("batch_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f32ee6d2385d9a8bc0cc92af5" ON "payouts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d6776c4b15328f608f2cd47b0" ON "payouts" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3291077cc61e78bffaf87bb04" ON "order_status_transitions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2827a919cee7b910f3a9b50767" ON "order_status_transitions" ("line_item_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7984a4baa6b6ab2cfc19c90a52" ON "order_status_transitions" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd37f8fc1a76e28f7ae5ccdd6b" ON "order_outbox" ("event_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93253eb9c9b6f11ef1ed47d3db" ON "order_outbox" ("aggregate_type", "aggregate_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d67a233da7f00ac91e62aefab" ON "order_outbox" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8eef5ed926f72f52767193e3b" ON "order_outbox_dlq" ("reprocessed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2871e6f23ddd4b3f846494dc62" ON "order_outbox_dlq" ("moved_to_dlq_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c324506f015b4439bab914a902" ON "order_outbox_dlq" ("aggregate_type", "aggregate_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80571a29892d33e19217ef281c" ON "order_outbox_dlq" ("event_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af08fad7c04bb85403970afdc1" ON "notifications" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9b444dd14c28c317a317eddac" ON "merchant_applications" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93a69215fd08feba68b2a4db8b" ON "merchant_applications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99fca4a3a4a93c26a756c5aca5" ON "audit_logs" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f68e345c05e8166ff9deea1ab" ON "audit_logs" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "UQ_bb1eff911850afbce86d1486b83" UNIQUE ("service_id", "provider_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "UQ_0c0873a128f05107061b233f836" UNIQUE ("service_id", "provider_id", "start_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ADD CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_7d80d63e220c4511ab4b6595846" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchants" ADD CONSTRAINT "FK_932ac199ae3be47144903de1c10" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_754a9ecec7627d432c2134dd00e" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_177397e044732e7e9c0215cd5b7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlists" ADD CONSTRAINT "FK_b5e6331a1a7d61c25d7a25cab8f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_ddd03cb28bed3c395141ecc05b3" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_4fc40fa220693bab09b5070d9b9" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ADD CONSTRAINT "FK_0fcf7372ed8c867428d29dfab53" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_78885189e86df1ec808ea36a57e" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "FK_297288bf81b5ab6e35c9b68eb50" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "FK_cfdda156311b6429147a3e16df1" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "FK_7269176c85d86bc6f2dc394e0d0" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "FK_d00390454a5dd54a45308329704" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_1a78b8c5dfec72b48032d70d7c0" FOREIGN KEY ("order_line_item_id") REFERENCES "order_line_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_aae90d7b26a7414deb4029ca1b3" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_7bc8366af1bd0c09850cef683bd" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_f97e70284f7a8d64abc4e713ce4" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "FK_e7a40b21f8fd548be206fcc89b2" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "FK_f2e00cecc72b7a0b0b379f3c834" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "FK_7b4b4fd73b20e7004f8bcc53229" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_501a21bc914fe8de16c06d7c9e3" FOREIGN KEY ("order_line_item_id") REFERENCES "order_line_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_dcf8f786aaeb2746c93a332b635" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "FK_c9352b22e520f3de5dd6f8f77e5" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_2d6776c4b15328f608f2cd47b0d" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_1b76e4bddfa2fad64cd91606760" FOREIGN KEY ("batch_id") REFERENCES "payout_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "FK_7984a4baa6b6ab2cfc19c90a52d" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "FK_2827a919cee7b910f3a9b507677" FOREIGN KEY ("line_item_id") REFERENCES "order_line_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "FK_a31e3d0818bce89a27d77f7ff2e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_applications" ADD CONSTRAINT "FK_734ceb9b7ad4430965148e0c524" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "merchant_applications" DROP CONSTRAINT "FK_734ceb9b7ad4430965148e0c524"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "FK_a31e3d0818bce89a27d77f7ff2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "FK_2827a919cee7b910f3a9b507677"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" DROP CONSTRAINT "FK_7984a4baa6b6ab2cfc19c90a52d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_1b76e4bddfa2fad64cd91606760"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" DROP CONSTRAINT "FK_2d6776c4b15328f608f2cd47b0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reconciliation_reports" DROP CONSTRAINT "FK_c9352b22e520f3de5dd6f8f77e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_dcf8f786aaeb2746c93a332b635"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_501a21bc914fe8de16c06d7c9e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_7f48aa5d56c42aeb495db016683"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "FK_7b4b4fd73b20e7004f8bcc53229"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "FK_f2e00cecc72b7a0b0b379f3c834"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_e7a40b21f8fd548be206fcc89b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "FK_f97e70284f7a8d64abc4e713ce4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_7bc8366af1bd0c09850cef683bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_aae90d7b26a7414deb4029ca1b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_1a78b8c5dfec72b48032d70d7c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "FK_d00390454a5dd54a45308329704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "FK_7269176c85d86bc6f2dc394e0d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "FK_cfdda156311b6429147a3e16df1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" DROP CONSTRAINT "FK_297288bf81b5ab6e35c9b68eb50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_78885189e86df1ec808ea36a57e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" DROP CONSTRAINT "FK_0fcf7372ed8c867428d29dfab53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_4fc40fa220693bab09b5070d9b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_ddd03cb28bed3c395141ecc05b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlists" DROP CONSTRAINT "FK_b5e6331a1a7d61c25d7a25cab8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_177397e044732e7e9c0215cd5b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_754a9ecec7627d432c2134dd00e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchants" DROP CONSTRAINT "FK_932ac199ae3be47144903de1c10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_7d80d63e220c4511ab4b6595846"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_7645bd68229997627f7b2191687"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" DROP CONSTRAINT "FK_1b7b07c6049367c6446c5ac5605"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "UQ_0c0873a128f05107061b233f836"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "UQ_bb1eff911850afbce86d1486b83"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_2f68e345c05e8166ff9deea1ab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_99fca4a3a4a93c26a756c5aca5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_93a69215fd08feba68b2a4db8b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f9b444dd14c28c317a317eddac"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_af08fad7c04bb85403970afdc1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_80571a29892d33e19217ef281c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c324506f015b4439bab914a902"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2871e6f23ddd4b3f846494dc62"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a8eef5ed926f72f52767193e3b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3d67a233da7f00ac91e62aefab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_93253eb9c9b6f11ef1ed47d3db"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fd37f8fc1a76e28f7ae5ccdd6b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7984a4baa6b6ab2cfc19c90a52"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2827a919cee7b910f3a9b50767"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f3291077cc61e78bffaf87bb04"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2d6776c4b15328f608f2cd47b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3f32ee6d2385d9a8bc0cc92af5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1b76e4bddfa2fad64cd9160676"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9840c85686a28883c7889e1527"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6968bde5ffc81eb965a323eff1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_829c23d35609f1a49b7b3cd608"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0dec1b56b05f04b1d4b9f8d61"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_40fd46129e1ec4c51938a131d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5a4c2793f01a45d5df781003f5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c9352b22e520f3de5dd6f8f77e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fe63c1bc3504acc23df15466a1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4542dd2f38a61354a040ba9fd5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b85ba602ae65eb5813f09e3cec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7f48aa5d56c42aeb495db01668"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_501a21bc914fe8de16c06d7c9e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_90c78d3c32a3346772edf34e73"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b2f7b823a21562eeca20e72b00"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_66e758f1718149c6d39f94d351"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1237daf748b7653a6ebb9492fe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f2e00cecc72b7a0b0b379f3c83"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b4b4fd73b20e7004f8bcc5322"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_48a3c7b67d4af688d4d38bd308"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f913cf47397d2e27579f89b73c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f97e70284f7a8d64abc4e713ce"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7a40b21f8fd548be206fcc89b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8acaf7b489ffd8187b5cdd504c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cfdcce31c9c571f9e5a8226dec"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_df22e2beaabc33a432b4f65e3c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8e21b7ae33e7b0673270de4146"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aae90d7b26a7414deb4029ca1b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c685a33a322760eb9021b4727e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_48b267d894e32a25ebde4b207a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a78b8c5dfec72b48032d70d7c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_635f82f17301d3b01132434a4d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a36598d1d2fc06b48a5f61009e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_297288bf81b5ab6e35c9b68eb5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cfdda156311b6429147a3e16df"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_961a9e3df9521bcb98d67cc3d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4cd6c9158b7552ab3e7be417fa"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cb77bc746d4e7b50c722fb2151"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_75eba1c6b1a66b09f2a97e6927"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c884e321f927d5b86aac7c8f9e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f625e45db729e93f76b07bca79"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5b358ba14d305dbce9ff3f709c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2411f08d2fd4c1d7ab68cb949"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2b193fce65f4fb6be5d716fea3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ddd03cb28bed3c395141ecc05b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4fc40fa220693bab09b5070d9b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_192dfe6815edb6328cc0bd2788"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_321b39fa8ba51a1fd268d9cb5e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c11d22eea73bbc94357f232643"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7c2f5f461ca00d421976e458ff"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_31f02494fefdb995eb8f6ce5dd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b5e6331a1a7d61c25d7a25cab8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9379dc3c7337db43e580df627"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_754a9ecec7627d432c2134dd00"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_177397e044732e7e9c0215cd5b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f169d18dc7fce81f4c20974fd0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_932ac199ae3be47144903de1c1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be101174daafd5f7af36134081"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_84f1d5ba14e3d8ec381d885248"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d80d63e220c4511ab4b659584"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d5662d5ea5da62fc54b0f12a46"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1846199852a695713b1f8f5e9a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_38ab7c0f55274f6c11f8886627"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a5d3059a2cdc79e4869e4f414e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1f77fd3293d18eba249603c545"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_431218829bc5c5ec9230232b96"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0c1757900275ef9ee6e37cff55"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6343513e20e2deab45edfce131"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_46f236f21640f9da218a063a86"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_deee14e1dd1ef09b51502b0d93"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_action_old" AS ENUM('profile_updated', 'email_changed', 'phone_changed', 'password_changed', 'password_reset_requested', 'password_reset_completed', 'email_verified', 'phone_verified', 'login', 'logout', 'failed_login', 'token_refresh', 'all_sessions_revoked', 'account_created', 'account_deleted', 'role_changed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "public"."audit_action_old" USING "action"::"text"::"public"."audit_action_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."audit_action_old" RENAME TO "audit_action"`);
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum_old" AS ENUM('ORDER_UPDATE', 'PAYMENT_SUCCESS', 'SHIPPING_UPDATE', 'BOOKING_REMINDER', 'PROMO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox_dlq" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_outbox_dlq" ALTER COLUMN "reprocessed" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox_dlq" ALTER COLUMN "moved_to_dlq_at" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_outbox" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."order_outbox_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_outbox" ADD "status" character varying(20) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "order_outbox" DROP COLUMN "aggregate_type"`);
    await queryRunner.query(`DROP TYPE "public"."order_outbox_aggregate_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_outbox" ADD "aggregate_type" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ALTER COLUMN "metadata" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payouts"."arrived_at" IS 'When funds arrived at merchant account'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payouts"."net_amount" IS 'Amount after deducting processing fee'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payouts"."processing_fee" IS 'Fee charged by provider for processing payout'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "payouts"."splits_included" IS 'Array of payment_split IDs included in this payout'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reconciliation_reports"."generated_by" IS 'User ID who generated the report'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reconciliation_reports"."report_data" IS 'Detailed report data'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reconciliation_reports"."discrepancies" IS 'Array of discrepancy details'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reconciliation_reports"."type" IS 'daily, weekly, monthly, on-demand'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "reconciliation_reports"."merchant_id" IS 'Null for system-wide reports'`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "revoked" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "used" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "requires_action" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "refunded_amount" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "captured_amount" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ALTER COLUMN "escrow_released" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "payment_splits" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "status" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "buffer_minutes" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "status_history" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ALTER COLUMN "fulfillment_data" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_line_items" DROP COLUMN "fulfillment_status"`);
    await queryRunner.query(`DROP TYPE "public"."order_line_items_fulfillment_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD "fulfillment_status" character varying(50) DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "order_line_items" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."order_line_items_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD "type" character varying(20) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
    await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "payment_status" character varying(20) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "status" character varying(20) NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."expires_at" IS 'Session expires after 30 minutes'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."metadata" IS 'Additional data: device info, referrer, etc.'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."error_message" IS 'Error details if checkout failed'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."order_number" IS 'Human-readable order number (e.g., ORD-12345)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."order_id" IS 'Link to created order after completion'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."idempotency_key" IS 'For preventing duplicate order creation'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_status_old" AS ENUM('in_progress', 'completed', 'expired', 'cancelled', 'failed')`,
    );
    await queryRunner.query(`ALTER TABLE "checkout_sessions" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "status" TYPE "public"."checkout_status_old" USING "status"::"text"::"public"."checkout_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "status" SET DEFAULT 'in_progress'`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_sessions_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."checkout_status_old" RENAME TO "checkout_status"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."promo_codes" IS 'Array of applied promo codes with amounts'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."totals" IS 'Format: {subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency}'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."payment_details" IS 'Encrypted/tokenized payment details'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method_type_old" AS ENUM('card', 'apple_pay', 'google_pay', 'bank_transfer', 'paypal', 'crypto', 'cash_on_delivery')`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "payment_method" TYPE "public"."payment_method_type_old" USING "payment_method"::"text"::"public"."payment_method_type_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_sessions_payment_method_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_method_type_old" RENAME TO "payment_method_type"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."delivery_method" IS 'Selected delivery method for physical items'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."delivery_method_type_old" AS ENUM('standard', 'express', 'pickup')`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "delivery_method" TYPE "public"."delivery_method_type_old" USING "delivery_method"::"text"::"public"."delivery_method_type_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_sessions_delivery_method_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."delivery_method_type_old" RENAME TO "delivery_method_type"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."billing_address" IS 'Same format as shipping_address, null = use shipping'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."shipping_address" IS 'Format: {country, state, city, street, postal_code, phone}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."checkout_step_old" AS ENUM('cart_review', 'shipping_address', 'payment_method', 'order_review', 'payment', 'confirmation', 'delivery_method')`,
    );
    await queryRunner.query(`ALTER TABLE "checkout_sessions" ALTER COLUMN "step" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "step" TYPE "public"."checkout_step_old" USING "step"::"text"::"public"."checkout_step_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ALTER COLUMN "step" SET DEFAULT 'cart_review'`,
    );
    await queryRunner.query(`DROP TYPE "public"."checkout_sessions_step_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."checkout_step_old" RENAME TO "checkout_step"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."cart_snapshot" IS 'Snapshot of cart items with locked prices'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "checkout_sessions"."session_id" IS 'For guest checkout'`,
    );
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "updated_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "metadata" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "schedules" ALTER COLUMN "exceptions" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user_addresses"."country" IS 'ISO 3166-1 alpha-2 country code'`,
    );
    await queryRunner.query(`ALTER TABLE "webhook_events" ALTER COLUMN "created_at" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "webhook_events" ALTER COLUMN "processed" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wishlists" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlists" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "users"."date_of_birth" IS 'User date of birth'`);
    await queryRunner.query(
      `COMMENT ON COLUMN "users"."avatar_url" IS 'URL to user avatar/profile picture'`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchants" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "currency" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "short_description"`);
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "uq_booking_slot" UNIQUE ("service_id", "provider_id", "start_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "uq_schedule_service_provider" UNIQUE ("service_id", "provider_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "webhook_events" ADD CONSTRAINT "uq_provider_event" UNIQUE ("provider", "provider_event_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_outbox" ADD CONSTRAINT "order_outbox_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'processed'::character varying, 'failed'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "transition_target" CHECK (((order_id IS NOT NULL) OR (line_item_id IS NOT NULL)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_minor_check" CHECK ((amount_minor >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "chk_payment_amounts" CHECK (((refunded_amount <= captured_amount) AND (captured_amount <= authorized_amount)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_platform_fee_check" CHECK ((platform_fee >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_amount_check" CHECK ((refunded_amount >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_captured_amount_check" CHECK ((captured_amount >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_authorized_amount_check" CHECK ((authorized_amount >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_minor_check" CHECK ((amount_minor >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "chk_split_calculation" CHECK ((net_amount = ((gross_amount - platform_fee) - processing_fee)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_net_amount_check" CHECK ((net_amount >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_processing_fee_check" CHECK ((processing_fee >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_platform_fee_check" CHECK ((platform_fee >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_gross_amount_check" CHECK ((gross_amount >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "chk_service_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'archived'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "services_price_minor_check" CHECK ((price_minor >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "services_buffer_minutes_check" CHECK ((buffer_minutes >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "services_duration_minutes_check" CHECK ((duration_minutes > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "chk_booking_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "chk_booking_time_valid" CHECK ((end_at > start_at))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_total_price_check" CHECK ((total_price >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_unit_price_check" CHECK ((unit_price >= 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_quantity_check" CHECK ((quantity > 0))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_type_check" CHECK (((type)::text = ANY ((ARRAY['physical'::character varying, 'digital'::character varying, 'service'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "order_user_or_guest" CHECK (((user_id IS NOT NULL) OR (guest_email IS NOT NULL)))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action_created_at" ON "audit_logs" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id_created_at" ON "audit_logs" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_merchant_applications_status" ON "merchant_applications" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_merchant_applications_user_id" ON "merchant_applications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_dlq_reprocessed" ON "order_outbox_dlq" ("reprocessed") WHERE (reprocessed = false)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_dlq_moved_at" ON "order_outbox_dlq" ("moved_to_dlq_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_dlq_aggregate" ON "order_outbox_dlq" ("aggregate_id", "aggregate_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_dlq_event_type" ON "order_outbox_dlq" ("event_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_next_retry" ON "order_outbox" ("next_retry_at") WHERE (((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[])) AND (next_retry_at IS NOT NULL))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_event_type" ON "order_outbox" ("event_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_aggregate" ON "order_outbox" ("aggregate_id", "aggregate_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_outbox_status" ON "order_outbox" ("status", "created_at") WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'failed'::character varying])::text[]))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transitions_created" ON "order_status_transitions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transitions_line_item" ON "order_status_transitions" ("line_item_id") WHERE (line_item_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transitions_order" ON "order_status_transitions" ("order_id") WHERE (order_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payouts_merchant_status" ON "payouts" ("merchant_id", "status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_payouts_created_at" ON "payouts" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_payouts_batch_id" ON "payouts" ("batch_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_payouts_status" ON "payouts" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_payouts_merchant_id" ON "payouts" ("merchant_id") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_payout_batches_created_at" ON "payout_batches" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payout_batches_scheduled_for" ON "payout_batches" ("scheduled_for") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payout_batches_status" ON "payout_batches" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reconciliation_reports_type_status" ON "reconciliation_reports" ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reconciliation_reports_merchant_id" ON "reconciliation_reports" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reconciliation_reports_date" ON "reconciliation_reports" ("report_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id_revoked" ON "refresh_tokens" ("user_id", "revoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_refunds_status" ON "refunds" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_refunds_line_item_id" ON "refunds" ("order_line_item_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_refunds_payment_id" ON "refunds" ("payment_id") `);
    await queryRunner.query(`CREATE INDEX "idx_payments_created_at" ON "payments" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_payments_provider_payment_id" ON "payments" ("provider", "provider_payment_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_payments_order_id" ON "payments" ("order_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_payment_splits_escrow" ON "payment_splits" ("escrow_release_date", "escrow_released") WHERE (((status)::text = 'captured'::text) AND (escrow_released = false))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_splits_status" ON "payment_splits" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_splits_merchant_id" ON "payment_splits" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_splits_payment_id" ON "payment_splits" ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_services_category" ON "services" ("category") WHERE (category IS NOT NULL)`,
    );
    await queryRunner.query(`CREATE INDEX "idx_services_status" ON "services" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_services_provider_id" ON "services" ("provider_id") WHERE (provider_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_services_merchant_id" ON "services" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_provider_schedule" ON "bookings" ("provider_id", "start_at") WHERE ((provider_id IS NOT NULL) AND ((status)::text <> ALL ((ARRAY['cancelled'::character varying, 'no_show'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_reminders" ON "bookings" ("start_at", "reminder_sent_at") WHERE (((status)::text = ANY ((ARRAY['confirmed'::character varying, 'pending'::character varying])::text[])) AND (reminder_sent_at IS NULL))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_order_line_item" ON "bookings" ("order_line_item_id") WHERE (order_line_item_id IS NOT NULL)`,
    );
    await queryRunner.query(`CREATE INDEX "idx_bookings_status" ON "bookings" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_time_range" ON "bookings" ("start_at", "end_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_provider_id" ON "bookings" ("provider_id") WHERE (provider_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_customer_id" ON "bookings" ("customer_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_bookings_service_id" ON "bookings" ("service_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_line_items_fulfillment" ON "order_line_items" ("fulfillment_status") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_line_items_type" ON "order_line_items" ("type") `);
    await queryRunner.query(
      `CREATE INDEX "idx_line_items_status" ON "order_line_items" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_line_items_merchant" ON "order_line_items" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_line_items_order" ON "order_line_items" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_checkout_session" ON "orders" ("checkout_session_id") WHERE (checkout_session_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_guest_email" ON "orders" ("guest_email") WHERE (guest_email IS NOT NULL)`,
    );
    await queryRunner.query(`CREATE INDEX "idx_orders_created" ON "orders" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "idx_orders_user" ON "orders" ("user_id") WHERE (user_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_checkout_sessions_active" ON "checkout_sessions" ("user_id", "created_at") WHERE (status = 'in_progress'::checkout_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_created_at" ON "checkout_sessions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_status_expires_at" ON "checkout_sessions" ("status", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_session_id" ON "checkout_sessions" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_checkout_sessions_user_id_status" ON "checkout_sessions" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_schedules_provider_id" ON "schedules" ("provider_id") WHERE (provider_id IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_schedules_service_id" ON "schedules" ("service_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_addresses_user_id_created_at" ON "user_addresses" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_addresses_user_id_is_default" ON "user_addresses" ("user_id", "is_default") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_webhook_events_processed" ON "webhook_events" ("processed") WHERE (processed = false)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_webhook_events_provider" ON "webhook_events" ("provider", "event_type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_wishlists_user_id" ON "wishlists" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wishlist_items_product_id" ON "wishlist_items" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wishlist_items_wishlist_id" ON "wishlist_items" ("wishlist_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_wishlist_items_wishlist_id_product_id" ON "wishlist_items" ("wishlist_id", "product_id") `,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") `);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone") WHERE (phone IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_merchants_kyc_status_status" ON "merchants" ("kyc_status", "status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_merchants_status" ON "merchants" ("status") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_merchants_kyc_status" ON "merchants" ("kyc_status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_merchants_owner_id" ON "merchants" ("owner_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_created_at" ON "products" ("created_at") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_sales_count" ON "products" ("sales_count") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_type_status_merchant" ON "products" ("merchant_id", "type", "status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_products_attrs_gin" ON "products" ("attrs") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_products_slug" ON "products" ("slug") WHERE (slug IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_type_status" ON "products" ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_merchant_status" ON "products" ("merchant_id", "status") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_products_status" ON "products" ("status") `);
    await queryRunner.query(`CREATE INDEX "IDX_products_type" ON "products" ("type") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_merchant_id" ON "products" ("merchant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_images_product_position" ON "product_images" ("product_id", "position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_images_product_id" ON "product_images" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_slug_locale" ON "product_translations" ("locale", "slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_description_trgm" ON "product_translations" ("description") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_title_trgm" ON "product_translations" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_search_gin" ON "product_translations" ("search_vector") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_translations_locale" ON "product_translations" ("locale") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_translations_product_locale" ON "product_translations" ("product_id", "locale") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_sku_trgm" ON "product_variants" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_inventory" ON "product_variants" ("inventory_quantity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_price_status" ON "product_variants" ("price_minor", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_attrs_gin" ON "product_variants" ("attrs") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_product_status" ON "product_variants" ("product_id", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_variants_sku" ON "product_variants" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_product_id" ON "product_variants" ("product_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_applications" ADD CONSTRAINT "FK_734ceb9b7ad4430965148e0c524" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "order_status_transitions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "order_status_transitions_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "order_line_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_status_transitions" ADD CONSTRAINT "order_status_transitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payouts" ADD CONSTRAINT "FK_2d6776c4b15328f608f2cd47b0d" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reconciliation_reports" ADD CONSTRAINT "FK_c9352b22e520f3de5dd6f8f77e5" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_line_item_id_fkey" FOREIGN KEY ("order_line_item_id") REFERENCES "order_line_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "services_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_line_item_id_fkey" FOREIGN KEY ("order_line_item_id") REFERENCES "order_line_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checkout_sessions" ADD CONSTRAINT "FK_0fcf7372ed8c867428d29dfab53" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_user_addresses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlists" ADD CONSTRAINT "FK_wishlists_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_wishlist_items_wishlist_id" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_wishlist_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchants" ADD CONSTRAINT "FK_merchants_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_merchant_id" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_translations" ADD CONSTRAINT "FK_product_translations_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
