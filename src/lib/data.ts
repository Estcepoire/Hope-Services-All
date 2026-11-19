import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { DeclarationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Lectures publiques mises en cache (Cache Components).
// Après une modification dans l'admin, appeler revalidateTag("<tag>") pour rafraîchir.

export async function getMaterials() {
  "use cache";
  cacheLife("hours");
  cacheTag("materials");
  return prisma.material.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true, category: true, pricePerKg: true },
  });
}

export async function getCollectionPoints() {
  "use cache";
  cacheLife("hours");
  cacheTag("collection-points");
  return prisma.collectionPoint.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      district: true,
      lat: true,
      lng: true,
      openingHours: true,
      acceptedMaterials: { select: { code: true, name: true } },
    },
  });
}

export async function getProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${slug}`);
  return prisma.product.findFirst({ where: { slug, published: true } });
}

/** Chiffres du compteur d'impact (déchets réellement pesés, collectes terminées). */
export async function getImpactStats() {
  "use cache";
  cacheLife("hours");
  cacheTag("impact");
  const done: DeclarationStatus[] = ["COLLECTEE", "PAYEE"];
  const [weighed, collections, points] = await Promise.all([
    prisma.wasteItem.aggregate({ _sum: { actualKg: true }, where: { declaration: { status: { in: done } } } }),
    prisma.wasteDeclaration.count({ where: { status: { in: done } } }),
    prisma.collectionPoint.count({ where: { active: true } }),
  ]);
  return { kgRecycled: weighed._sum?.actualKg ?? 0, collections, points };
}
