-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('MAISON', 'MODE', 'CONSTRUCTION', 'PAPETERIE', 'AUTRE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'AUTRE';

