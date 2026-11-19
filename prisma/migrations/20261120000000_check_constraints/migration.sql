-- Règles métier garanties par la base elle-même, en plus de la validation de l'application
-- (src/lib/actions/*). Prisma ne modélise pas les contraintes CHECK : elles vivent ici.

-- Montants et quantités
ALTER TABLE "Material"         ADD CONSTRAINT "Material_price_positive"      CHECK ("pricePerKg" >= 0);
ALTER TABLE "User"             ADD CONSTRAINT "User_credit_positive"         CHECK ("creditBalance" >= 0);
ALTER TABLE "Product"          ADD CONSTRAINT "Product_price_positive"       CHECK ("price" >= 0);
ALTER TABLE "Product"          ADD CONSTRAINT "Product_stock_positive"       CHECK ("stock" >= 0);
ALTER TABLE "Product"          ADD CONSTRAINT "Product_recycled_positive"    CHECK ("recycledKg" IS NULL OR "recycledKg" > 0);
ALTER TABLE "WasteItem"        ADD CONSTRAINT "WasteItem_estimated_range"    CHECK ("estimatedKg" > 0 AND "estimatedKg" <= 10000);
ALTER TABLE "WasteItem"        ADD CONSTRAINT "WasteItem_actual_positive"    CHECK ("actualKg" IS NULL OR "actualKg" >= 0);
ALTER TABLE "MaterialLot"      ADD CONSTRAINT "MaterialLot_total_positive"   CHECK ("totalKg" >= 0);
ALTER TABLE "Order"            ADD CONSTRAINT "Order_amounts_positive"       CHECK ("total" >= 0 AND "creditsUsed" >= 0);
ALTER TABLE "OrderItem"        ADD CONSTRAINT "OrderItem_quantity_positive"  CHECK ("quantity" > 0 AND "unitPrice" >= 0);
ALTER TABLE "Payment"          ADD CONSTRAINT "Payment_amount_positive"      CHECK ("amount" > 0);

-- Déclarations de déchets
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_values_positive"
  CHECK ("estimatedValue" >= 0 AND ("finalValue" IS NULL OR "finalValue" >= 0));
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_coordinates"
  CHECK (("lat" IS NULL AND "lng" IS NULL) OR ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180));
-- Un enlèvement a une adresse et une position ; un apport a un point d'apport.
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_mode_consistency"
  CHECK (("mode" = 'ENLEVEMENT' AND "address" IS NOT NULL AND "lat" IS NOT NULL AND "lng" IS NOT NULL)
      OR ("mode" = 'APPORT' AND "collectionPointId" IS NOT NULL));
-- Paiement mobile money : numéro malgache normalisé obligatoire (0341234567).
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_payout_phone"
  CHECK ("payoutMethod" NOT IN ('MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY')
      OR "payoutPhone" ~ '^03[2-478][0-9]{7}$');
-- Une collecte terminée a une date de collecte.
ALTER TABLE "WasteDeclaration" ADD CONSTRAINT "WasteDeclaration_collected_date"
  CHECK ("status" NOT IN ('COLLECTEE', 'PAYEE') OR "collectedAt" IS NOT NULL);

-- Points d'apport
ALTER TABLE "CollectionPoint"  ADD CONSTRAINT "CollectionPoint_coordinates"
  CHECK ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180);

-- Messages de contact : longueurs maximales (mêmes limites que le formulaire)
ALTER TABLE "ContactMessage"   ADD CONSTRAINT "ContactMessage_lengths"
  CHECK (char_length("name") <= 100 AND char_length("contact") <= 120 AND char_length("message") <= 2000);
