/*
  Warnings:

  - Added the required column `productName` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."CartItem_productId_idx";

-- DropIndex
DROP INDEX "public"."CartItem_variantId_idx";

-- AlterTable
ALTER TABLE "public"."CartItem" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "productImageUrl" TEXT,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "variantAttributes" JSONB,
ADD COLUMN     "variantSku" TEXT;
