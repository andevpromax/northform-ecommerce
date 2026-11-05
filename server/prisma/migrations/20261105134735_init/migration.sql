-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('awaiting_payment', 'payment_failed', 'confirmed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Refused', 'Authorised');

-- CreateEnum
CREATE TYPE "PaymentOutcome" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "products" (
    "id" VARCHAR(80) NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "image" VARCHAR(500) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "voucher_code" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "product_id" VARCHAR(80) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "request_fingerprint" CHAR(64) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'awaiting_payment',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "currency" CHAR(3) NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL,
    "shipping_cents" INTEGER NOT NULL,
    "vat_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "voucher_code" VARCHAR(50),
    "voucher_description" VARCHAR(200),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "street_and_number" VARCHAR(200) NOT NULL,
    "city" VARCHAR(250) NOT NULL,
    "zip_code" VARCHAR(12) NOT NULL,
    "country" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" VARCHAR(80),
    "entry_number" INTEGER NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total_cents" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "outcome" "PaymentOutcome" NOT NULL,
    "result_status" "PaymentStatus" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_position_key" ON "products"("position");

-- CreateIndex
CREATE INDEX "guest_sessions_last_seen_at_idx" ON "guest_sessions"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "carts_session_id_key" ON "carts"("session_id");

-- CreateIndex
CREATE INDEX "carts_voucher_code_idx" ON "carts"("voucher_code");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_created_at_idx" ON "cart_items"("cart_id", "created_at");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");

-- CreateIndex
CREATE INDEX "orders_session_id_created_at_idx" ON "orders"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_session_id_idempotency_key_key" ON "orders"("session_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_entry_number_key" ON "order_items"("order_id", "entry_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "guest_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_voucher_code_fkey" FOREIGN KEY ("voucher_code") REFERENCES "vouchers"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "guest_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK constraints (not expressible in the Prisma schema language)
ALTER TABLE "products"
  ADD CONSTRAINT "products_price_cents_check" CHECK ("price_cents" >= 0),
  ADD CONSTRAINT "products_stock_check" CHECK ("stock" >= 0),
  ADD CONSTRAINT "products_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_check" CHECK ("quantity" BETWEEN 1 AND 99);

ALTER TABLE "vouchers"
  ADD CONSTRAINT "vouchers_discount_value_check" CHECK (
    ("discount_type" = 'PERCENTAGE' AND "discount_value" BETWEEN 1 AND 100)
    OR ("discount_type" = 'FIXED' AND "discount_value" > 0)
  ),
  ADD CONSTRAINT "vouchers_validity_check" CHECK (
    "valid_from" IS NULL OR "valid_until" IS NULL OR "valid_from" < "valid_until"
  );

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_check" CHECK (
    "subtotal_cents" >= 0 AND "discount_cents" >= 0 AND "shipping_cents" >= 0
    AND "vat_cents" >= 0 AND "total_cents" >= 0
    AND "total_cents" = "subtotal_cents" - "discount_cents" + "shipping_cents"
  );

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_check" CHECK ("quantity" BETWEEN 1 AND 99),
  ADD CONSTRAINT "order_items_amounts_check" CHECK (
    "unit_price_cents" >= 0 AND "line_total_cents" = "unit_price_cents" * "quantity"
  );

ALTER TABLE "payment_transactions"
  ADD CONSTRAINT "payment_transactions_amount_check" CHECK ("amount_cents" >= 0),
  ADD CONSTRAINT "payment_transactions_result_check" CHECK ("result_status" IN ('Authorised', 'Refused'));
