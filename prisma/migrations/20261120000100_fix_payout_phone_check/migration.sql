-- Correctif : « NULL ~ motif » vaut NULL, et une contrainte CHECK qui vaut NULL est acceptée.
-- Le numéro doit donc être explicitement non nul pour un paiement mobile money.
ALTER TABLE "WasteDeclaration" DROP CONSTRAINT "WasteDeclaration_payout_phone";
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_payout_phone"
  CHECK ("payoutMethod" NOT IN ('MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY')
      OR ("payoutPhone" IS NOT NULL AND "payoutPhone" ~ '^03[2-478][0-9]{7}$'));
