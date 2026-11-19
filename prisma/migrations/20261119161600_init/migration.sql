-- PostGIS : calculs de distance et recherche du point d'apport le plus proche (src/lib/geo.ts)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'COLLECTEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('PLASTIQUE', 'PAPIER_CARTON', 'METAL', 'VERRE', 'ELECTRONIQUE', 'TEXTILE', 'ORGANIQUE', 'AUTRE');

-- CreateEnum
CREATE TYPE "CollectionMode" AS ENUM ('ENLEVEMENT', 'APPORT');

-- CreateEnum
CREATE TYPE "DeclarationStatus" AS ENUM ('EN_ATTENTE', 'PLANIFIEE', 'COLLECTEE', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY', 'ESPECES', 'CREDIT_BOUTIQUE');

-- CreateEnum
CREATE TYPE "WasteQuality" AS ENUM ('TRIE_PROPRE', 'TRIE_SALE', 'MELANGE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EN_ATTENTE_PAIEMENT', 'PAYEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHOUE', 'REMBOURSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICULIER',
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "nif" TEXT,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MaterialCategory" NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "openingHours" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CollectionPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteDeclaration" (
    "id" TEXT NOT NULL,
    "mode" "CollectionMode" NOT NULL,
    "status" "DeclarationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "declarantId" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "collectionPointId" TEXT,
    "collectorId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "photoUrls" TEXT[],
    "notes" TEXT,
    "estimatedValue" INTEGER NOT NULL,
    "finalValue" INTEGER,
    "payoutMethod" "PaymentMethod" NOT NULL DEFAULT 'MVOLA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteItem" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quality" "WasteQuality" NOT NULL DEFAULT 'TRIE_PROPRE',
    "estimatedKg" DOUBLE PRECISION NOT NULL,
    "actualKg" DOUBLE PRECISION,
    "lotId" TEXT,

    CONSTRAINT "WasteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialLot" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "recycledKg" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLot" (
    "productId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,

    CONSTRAINT "ProductLot_pkey" PRIMARY KEY ("productId","lotId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
    "total" INTEGER NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "amount" INTEGER NOT NULL,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionPointToMaterial" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionPointToMaterial_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "WasteDeclaration_status_idx" ON "WasteDeclaration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialLot_reference_key" ON "MaterialLot"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "_CollectionPointToMaterial_B_index" ON "_CollectionPointToMaterial"("B");

-- AddForeignKey
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_declarantId_fkey" FOREIGN KEY ("declarantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "CollectionPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteItem" ADD CONSTRAINT "WasteItem_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "WasteDeclaration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteItem" ADD CONSTRAINT "WasteItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteItem" ADD CONSTRAINT "WasteItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MaterialLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialLot" ADD CONSTRAINT "MaterialLot_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLot" ADD CONSTRAINT "ProductLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLot" ADD CONSTRAINT "ProductLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "MaterialLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionPointToMaterial" ADD CONSTRAINT "_CollectionPointToMaterial_A_fkey" FOREIGN KEY ("A") REFERENCES "CollectionPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionPointToMaterial" ADD CONSTRAINT "_CollectionPointToMaterial_B_fkey" FOREIGN KEY ("B") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
