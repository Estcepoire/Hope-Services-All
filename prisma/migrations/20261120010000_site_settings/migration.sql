-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "description" TEXT,
    "slogan" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "facebook" TEXT,
    "openingHours" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);


-- Une seule ligne de paramètres
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_singleton" CHECK ("id" = 'default');
