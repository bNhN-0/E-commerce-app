/*
  Warnings:

  - A unique constraint covering the columns `[wishlistId,productId,variantId]` on the table `WishlistItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."WishlistItem_wishlistId_productId_key";

-- AlterTable
ALTER TABLE "public"."WishlistItem" ADD COLUMN     "variantId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_variantId_key" ON "public"."WishlistItem"("wishlistId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
