"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type ContactFormState = { ok?: boolean; error?: string; fieldErrors?: Partial<Record<string, string>> };

const schema = z.object({
  topic: z.enum(["PARTICULIER", "ENTREPRISE", "BOUTIQUE", "PARTENARIAT", "AUTRE"]),
  name: z.string().trim().min(2, "Indiquez votre nom.").max(100),
  contact: z.string().trim().min(6, "Indiquez un téléphone ou un e-mail pour vous répondre.").max(120),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Votre message est un peu court.").max(2000),
});

export async function sendContactMessage(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Champ piège invisible : un robot le remplit, un humain ne le voit pas.
  if (formData.get("website")) return { ok: true };

  const parsed = schema.safeParse({
    topic: formData.get("topic"),
    name: formData.get("name"),
    contact: formData.get("contact"),
    company: formData.get("company") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }

  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
