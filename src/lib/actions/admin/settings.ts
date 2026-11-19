"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeMgPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const schema = z.object({
  description: optional(300),
  slogan: optional(80),
  address: optional(200),
  phone: optional(30),
  email: z.union([z.literal(""), z.email("Adresse e-mail invalide.")]).optional().transform((v) => v || null),
  whatsapp: optional(30),
  facebook: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Lien Facebook invalide (https://…)." })]).optional().transform((v) => v || null),
  openingHours: optional(120),
});

export async function saveSettings(formData: FormData) {
  await requireRole(["admin"], "/admin/parametres");
  const parsed = schema.safeParse(Object.fromEntries(["description", "slogan", "address", "phone", "email", "whatsapp", "facebook", "openingHours"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) redirect(`/admin/parametres?erreur=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const data = parsed.data!;

  if (data.phone && !normalizeMgPhone(data.phone) && !/^[+\d][\d\s.-]{6,}$/.test(data.phone)) {
    redirect(`/admin/parametres?erreur=${encodeURIComponent("Numéro de téléphone invalide.")}`);
  }
  // WhatsApp : format international sans « + » pour les liens wa.me (034… → 26134…).
  if (data.whatsapp) {
    const local = normalizeMgPhone(data.whatsapp);
    data.whatsapp = local ? `261${local.slice(1)}` : data.whatsapp.replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(data.whatsapp)) redirect(`/admin/parametres?erreur=${encodeURIComponent("Numéro WhatsApp invalide.")}`);
  }

  await prisma.siteSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
  updateTag("settings");
  redirect("/admin/parametres?ok=1");
}
