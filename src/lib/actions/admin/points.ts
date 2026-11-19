"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isInMadagascar } from "@/lib/distance";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export type PointFormState = { error?: string; fieldErrors?: Partial<Record<string, string>> };

const schema = z
  .object({
    name: z.string().trim().min(3, "Nom trop court.").max(120),
    address: z.string().trim().min(3, "Adresse trop courte.").max(200),
    district: z.string().trim().max(80).optional(),
    openingHours: z.string().trim().max(120).optional(),
    lat: z.coerce.number({ error: "Placez le point sur la carte." }),
    lng: z.coerce.number({ error: "Placez le point sur la carte." }),
    active: z.boolean(),
    materialIds: z.array(z.string()).max(50),
  })
  .refine((v) => isInMadagascar(v), { path: ["lat"], message: "Position hors de Madagascar." });

export async function savePoint(_prev: PointFormState, formData: FormData): Promise<PointFormState> {
  await requireRole(["admin"], "/admin/points");
  const id = (formData.get("id") as string) || undefined;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    district: formData.get("district") || undefined,
    openingHours: formData.get("openingHours") || undefined,
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    active: formData.get("active") === "on",
    materialIds: formData.getAll("materialIds").map(String),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }
  const { materialIds, ...data } = parsed.data;
  // Seuls des matériaux existants peuvent être reliés.
  const materials = await prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true } });
  const payload = { ...data, district: data.district ?? null, openingHours: data.openingHours ?? null };

  if (id) {
    await prisma.collectionPoint.update({ where: { id }, data: { ...payload, acceptedMaterials: { set: materials } } });
  } else {
    await prisma.collectionPoint.create({ data: { ...payload, acceptedMaterials: { connect: materials } } });
  }
  updateTag("collection-points");
  updateTag("impact"); // nombre de points d'apport affiché sur l'accueil
  redirect(`/admin/points?ok=${id ? "modifie" : "cree"}`);
}

export async function deletePoint(formData: FormData) {
  await requireRole(["admin"], "/admin/points");
  const id = String(formData.get("id"));
  const used = await prisma.wasteDeclaration.count({ where: { collectionPointId: id } });
  if (used > 0) {
    // Des apports y sont rattachés : on le garde pour l'historique et on le retire de la carte.
    await prisma.collectionPoint.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.collectionPoint.delete({ where: { id } });
  }
  updateTag("collection-points");
  updateTag("impact");
  redirect(`/admin/points?ok=${used > 0 ? "desactive" : "supprime"}`);
}
