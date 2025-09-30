/*
  Warnings:

  - You are about to drop the `SavedItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."SavedItem" DROP CONSTRAINT "SavedItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedItem" DROP CONSTRAINT "SavedItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedItem" DROP CONSTRAINT "SavedItem_variantId_fkey";

-- DropTable
DROP TABLE "public"."SavedItem";
