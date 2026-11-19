"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { DeclarationStatus } from "@/generated/prisma/enums";
import { roadKmFromDepot } from "@/lib/distance";
import { estimate } from "@/lib/estimation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// Traitement d'une demande d'enlèvement par l'admin. Chaque action vérifie le rôle, l'état de départ
// (transitions autorisées) et applique la mise à jour de façon conditionnelle (pas de double traitement).

const back = (id: string, message?: string) =>
  redirect(`/admin/collectes/${id}${message ? `?erreur=${encodeURIComponent(message)}` : "?ok=1"}`);

async function transition(id: string, from: DeclarationStatus[], data: Prisma.WasteDeclarationUncheckedUpdateManyInput) {
  const { count } = await prisma.wasteDeclaration.updateMany({ where: { id, status: { in: from } }, data });
  return count === 1;
}

export async function planPickup(formData: FormData) {
  await requireRole(["admin"], "/admin/collectes");
  const id = String(formData.get("id"));
  const parsed = z
    .object({ scheduledAt: z.coerce.date(), collectorId: z.string().optional() })
    .safeParse({ scheduledAt: formData.get("scheduledAt"), collectorId: formData.get("collectorId") || undefined });
  if (!parsed.success) back(id, "Date de passage invalide.");
  const { scheduledAt, collectorId } = parsed.data!;

  if (collectorId) {
    const collector = await prisma.user.findFirst({ where: { id: collectorId, role: { in: ["COLLECTEUR", "ADMIN"] } }, select: { id: true } });
    if (!collector) back(id, "Collecteur inconnu.");
  }
  const ok = await transition(id, ["EN_ATTENTE", "PLANIFIEE"], { status: "PLANIFIEE", scheduledAt, collectorId: collectorId ?? null });
  back(id, ok ? undefined : "Cette demande ne peut plus être planifiée.");
}

export async function recordWeighing(formData: FormData) {
  await requireRole(["admin"], "/admin/collectes");
  const id = String(formData.get("id"));
  const declaration = await prisma.wasteDeclaration.findUnique({
    where: { id },
    include: { items: { include: { material: { select: { code: true, pricePerKg: true } } } } },
  });
  if (!declaration || !["PLANIFIEE", "EN_ATTENTE"].includes(declaration.status)) back(id, "Cette demande ne peut plus être pesée.");

  const weights = new Map<string, number>();
  for (const item of declaration!.items) {
    const kg = Number(String(formData.get(`kg-${item.id}`) ?? "").replace(",", "."));
    if (!Number.isFinite(kg) || kg < 0 || kg > 10000) back(id, "Poids invalide : indiquez un nombre entre 0 et 10 000 kg.");
    weights.set(item.id, kg);
  }

  // Montant final : même calcul que l'estimation, avec les poids réels et les prix du jour.
  const { net } = estimate({
    mode: declaration!.mode,
    distanceKm: declaration!.lat != null && declaration!.lng != null ? roadKmFromDepot({ lat: declaration!.lat, lng: declaration!.lng }) : 0,
    lines: declaration!.items.map((i) => ({
      materialCode: i.material.code,
      pricePerKg: i.material.pricePerKg,
      kg: weights.get(i.id)!,
      quality: i.quality,
    })),
  });

  const ok = await prisma.$transaction(async (tx) => {
    const { count } = await tx.wasteDeclaration.updateMany({
      where: { id, status: { in: ["EN_ATTENTE", "PLANIFIEE"] } },
      data: { status: "COLLECTEE", collectedAt: new Date(), finalValue: net },
    });
    if (count === 0) return false;
    for (const [itemId, kg] of weights) await tx.wasteItem.update({ where: { id: itemId }, data: { actualKg: kg } });
    return true;
  });
  updateTag("impact"); // compteur d'impact de l'accueil (kg recyclés)
  back(id, ok ? undefined : "Cette demande a changé entre-temps.");
}

export async function markPaid(formData: FormData) {
  await requireRole(["admin"], "/admin/collectes");
  const id = String(formData.get("id"));

  const ok = await prisma.$transaction(async (tx) => {
    const d = await tx.wasteDeclaration.findUnique({ where: { id }, select: { status: true, payoutMethod: true, finalValue: true, declarantId: true } });
    if (!d || d.status !== "COLLECTEE" || d.finalValue == null) return false;
    const { count } = await tx.wasteDeclaration.updateMany({ where: { id, status: "COLLECTEE" }, data: { status: "PAYEE" } });
    if (count === 0) return false;
    // Paiement en crédits boutique : versé directement sur le compte du déclarant.
    if (d.payoutMethod === "CREDIT_BOUTIQUE" && d.finalValue > 0) {
      await tx.user.update({ where: { id: d.declarantId }, data: { creditBalance: { increment: d.finalValue } } });
    }
    return true;
  });
  updateTag("impact");
  back(id, ok ? undefined : "Seule une collecte pesée peut être marquée payée.");
}

export async function cancelPickup(formData: FormData) {
  await requireRole(["admin"], "/admin/collectes");
  const id = String(formData.get("id"));
  const ok = await transition(id, ["EN_ATTENTE", "PLANIFIEE"], { status: "ANNULEE" });
  back(id, ok ? undefined : "Cette demande ne peut plus être annulée.");
}
