-- CreateEnum
CREATE TYPE "ContactTopic" AS ENUM ('PARTICULIER', 'ENTREPRISE', 'BOUTIQUE', 'PARTENARIAT', 'AUTRE');

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "topic" "ContactTopic" NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_handled_createdAt_idx" ON "ContactMessage"("handled", "createdAt");

