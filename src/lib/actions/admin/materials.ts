"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const CATEGORIES = ["PLASTIQUE", "PAPIER_CARTON", "METAL", "VERRE", "ELECTRONIQUE", "TEXTILE", "ORGANIQUE", "AUTRE"] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.enum(CATEGORIES),
  pricePerKg: z.coerce.number().int().min(0).max(10_000_000),
  active: z.boolean(),
});

const back = (message: string, error = false) => redirect(`/admin/tarifs?${error ? "erreur" : "ok"}=${encodeURIComponent(message)}`);

function done(message: string) {
  // Prix utilisés par le simulateur, le formulaire d'enlèvement et la page Collecte.
  updateTag("materials");
  back(message);
}

export async function saveMaterial(formData: FormData) {
  await requireRole(["admin"], "/admin/tarifs");
  const id = (formData.get("id") as string) || undefined;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    pricePerKg: formData.get("pricePerKg"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back("Valeurs invalides : nom (2 caractères minimum) et prix entier positif.", true);

  if (id) {
    await prisma.material.update({ where: { id }, data: parsed.data! });
    done(`« ${parsed.data!.name} » mis à jour.`);
  }

  const code = z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,20}$/).safeParse(formData.get("code"));
  if (!code.success) back("Code invalide : 2 à 20 lettres, chiffres ou _ (ex. PET, ALU).", true);
  if (await prisma.material.findUnique({ where: { code: code.data! } })) back(`Le code ${code.data} existe déjà.`, true);
  await prisma.material.create({ data: { ...parsed.data!, code: code.data! } });
  done(`« ${parsed.data!.name} » ajouté.`);
}

export async function deleteMaterial(formData: FormData) {
  await requireRole(["admin"], "/admin/tarifs");
  const id = String(formData.get("id"));
  const m = await prisma.material.findUnique({ where: { id }, select: { name: true, _count: { select: { items: true, lots: true } } } });
  if (!m) back("Matériau introuvable.", true);
  if (m!._count.items + m!._count.lots > 0) {
    // Déjà utilisé dans des collectes : on le garde pour l'historique, il disparaît seulement des formulaires.
    await prisma.material.update({ where: { id }, data: { active: false } });
    done(`« ${m!.name} » est utilisé dans des collectes : il a été désactivé au lieu d'être supprimé.`);
  }
  await prisma.material.delete({ where: { id } });
  done(`« ${m!.name} » supprimé.`);
}
