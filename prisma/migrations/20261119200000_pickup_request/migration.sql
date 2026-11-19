-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('MATIN', 'APRES_MIDI');

-- AlterTable
ALTER TABLE "WasteDeclaration" ADD COLUMN     "payoutPhone" TEXT,
ADD COLUMN     "preferredDate" DATE,
ADD COLUMN     "preferredSlot" "TimeSlot";

