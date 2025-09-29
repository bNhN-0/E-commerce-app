-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "status" "public"."ProductStatus" NOT NULL DEFAULT 'ACTIVE';
