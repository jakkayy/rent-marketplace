/*
  Warnings:

  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Shop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'UNAVAILABLE', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "RentalStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isActive",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "isActive",
ADD COLUMN     "district" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "status" "ShopStatus" NOT NULL DEFAULT 'PENDING';
