"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { APP_ROLES } from "@/auth";
import { isInMadagascar, roadKmFromDepot } from "@/lib/distance";
import { estimate } from "@/lib/estimation";
import { normalizeMgPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { deleteDeclarationPhotos, MAX_PHOTOS, saveDeclarationPhoto, validatePhoto } from "@/lib/uploads";

export type PickupFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

const itemSchema = z.object({
  materialId: z.string().min(1),
  kg: z.number().positive("Indiquez un poids supérieur à 0.").max(10000),
  quality: z.enum(["TRIE_PROPRE", "TRIE_SALE", "MELANGE"]),
});

function tomorrow() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

const pickupSchema = z
  .object({
    items: z.array(itemSchema).min(1, "Ajoutez au moins un matériau.").max(20),
    address: z.string().trim().min(5, "Indiquez une adresse ou un repère.").max(300),
    lat: z.coerce.number({ error: "Placez votre position sur la carte." }),
    lng: z.coerce.number({ error: "Placez votre position sur la carte." }),
    preferredDate: z.coerce
      .date({ error: "Choisissez une date." })
      .refine((d) => d >= tomorrow(), "Choisissez une date à partir de demain."),
    preferredSlot: z.enum(["MATIN", "APRES_MIDI"]),
    payoutMethod: z.enum(["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "ESPECES", "CREDIT_BOUTIQUE"]),
    payoutPhone: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => isInMadagascar(v), { path: ["lat"], message: "Position hors de Madagascar." });

const MOBILE_MONEY = new Set(["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]);

export async function createPickupRequest(_prev: PickupFormState, formData: FormData): Promise<PickupFormState> {
  const session = await requireRole([...APP_ROLES], "/collecte/declarer");

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Liste des matériaux illisible, rechargez la page." };
  }

  const parsed = pickupSchema.safeParse({
    items,
    address: formData.get("address"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredSlot: formData.get("preferredSlot"),
    payoutMethod: formData.get("payoutMethod"),
    payoutPhone: formData.get("payoutPhone") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }
  const data = parsed.data;

  let payoutPhone: string | null = null;
  if (MOBILE_MONEY.has(data.payoutMethod)) {
    payoutPhone = normalizeMgPhone(data.payoutPhone ?? "");
    if (!payoutPhone) {
      return { error: "Certains champs sont à corriger.", fieldErrors: { payoutPhone: "Numéro mobile invalide (ex : 034 12 345 67)." } };
    }
  }

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { fieldErrors: { photos: `${MAX_PHOTOS} photos maximum.` } };
  for (const p of photos) {
    const err = validatePhoto(p);
    if (err) return { fieldErrors: { photos: err } };
  }

  // Prix lus en base, jamais depuis le navigateur.
  const materials = await prisma.material.findMany({
    where: { id: { in: data.items.map((i) => i.materialId) }, active: true },
    select: { id: true, code: true, pricePerKg: true },
  });
  const byId = new Map(materials.map((m) => [m.id, m]));
  if (data.items.some((i) => !byId.has(i.materialId))) {
    return { error: "Un matériau n'est plus disponible, rechargez la page." };
  }

  const { net } = estimate({
    mode: "ENLEVEMENT",
    distanceKm: roadKmFromDepot(data),
    lines: data.items.map((i) => {
      const m = byId.get(i.materialId)!;
      return { materialCode: m.code, pricePerKg: m.pricePerKg, kg: i.kg, quality: i.quality };
    }),
  });

  const declaration = await prisma.wasteDeclaration.create({
    data: {
      mode: "ENLEVEMENT",
      declarantId: session.user.id,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      preferredDate: data.preferredDate,
      preferredSlot: data.preferredSlot,
      payoutMethod: data.payoutMethod,
      payoutPhone,
      notes: data.notes,
      estimatedValue: net,
      items: { create: data.items.map((i) => ({ materialId: i.materialId, estimatedKg: i.kg, quality: i.quality })) },
    },
    select: { id: true },
  });

  if (photos.length) {
    try {
      const photoUrls = await Promise.all(photos.map((p) => saveDeclarationPhoto(declaration.id, p)));
      await prisma.wasteDeclaration.update({ where: { id: declaration.id }, data: { photoUrls } });
    } catch (e) {
      console.error("Enregistrement des photos impossible", e);
      await deleteDeclarationPhotos(declaration.id);
      await prisma.wasteDeclaration.delete({ where: { id: declaration.id } });
      return { error: "Les photos n'ont pas pu être enregistrées. Réessayez." };
    }
  }

  redirect(`/compte/collectes/${declaration.id}?nouvelle=1`);
}
