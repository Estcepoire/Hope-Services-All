// Données de démonstration. Lancer : npm run db:seed
// ⚠️ Les prix et les points d'apport sont des EXEMPLES : remplacez-les par vos tarifs et adresses réels.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const materials = [
  { code: "PET", name: "Bouteilles plastique (PET)", category: "PLASTIQUE", pricePerKg: 400 },
  { code: "PEHD", name: "Bidons et flacons (PEHD)", category: "PLASTIQUE", pricePerKg: 350 },
  { code: "CARTON", name: "Carton", category: "PAPIER_CARTON", pricePerKg: 150 },
  { code: "PAPIER", name: "Papier de bureau", category: "PAPIER_CARTON", pricePerKg: 200 },
  { code: "ALU", name: "Canettes aluminium", category: "METAL", pricePerKg: 2500 },
  { code: "FER", name: "Ferraille", category: "METAL", pricePerKg: 600 },
  { code: "CUIVRE", name: "Cuivre", category: "METAL", pricePerKg: 15000 },
  { code: "VERRE", name: "Verre", category: "VERRE", pricePerKg: 100 },
  { code: "DEEE", name: "Déchets électroniques", category: "ELECTRONIQUE", pricePerKg: 1000 },
  { code: "TEXTILE", name: "Textile", category: "TEXTILE", pricePerKg: 150 },
] as const;

const points = [
  { name: "Point d'apport Analakely (exemple)", address: "Analakely, Antananarivo", district: "1er arrondissement", lat: -18.9075, lng: 47.525 },
  { name: "Point d'apport 67 Ha (exemple)", address: "67 Ha, Antananarivo", district: "1er arrondissement", lat: -18.901, lng: 47.511 },
  { name: "Point d'apport Ankorondrano (exemple)", address: "Ankorondrano, Antananarivo", district: "4e arrondissement", lat: -18.874, lng: 47.522 },
  { name: "Point d'apport Ivandry (exemple)", address: "Ivandry, Antananarivo", district: "6e arrondissement", lat: -18.87, lng: 47.533 },
];

const products = [
  { slug: "sac-cabas-recycle", name: "Sac cabas en plastique recyclé", description: "Sac solide tissé à partir de sachets plastique collectés à Antananarivo.", price: 15000, stock: 20, recycledKg: 0.3 },
  { slug: "pave-plastique", name: "Pavé en plastique recyclé", description: "Pavé résistant fabriqué à partir de plastique fondu et de sable.", price: 2500, stock: 500, recycledKg: 1.2 },
  { slug: "carnet-papier-recycle", name: "Carnet en papier recyclé", description: "Carnet A5 fait main à partir de papier de bureau récupéré.", price: 8000, stock: 40, recycledKg: 0.2 },
];

async function main() {
  for (const m of materials) {
    await prisma.material.upsert({ where: { code: m.code }, update: {}, create: m });
  }
  const all = await prisma.material.findMany({ select: { id: true } });

  if ((await prisma.collectionPoint.count()) === 0) {
    for (const p of points) {
      await prisma.collectionPoint.create({
        data: { ...p, openingHours: "Lun–Sam 8h–17h", acceptedMaterials: { connect: all } },
      });
    }
  }

  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, published: true } });
  }

  console.log(`Seed OK : ${materials.length} matériaux, ${points.length} points, ${products.length} produits`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
