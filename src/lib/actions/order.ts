"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { APP_ROLES } from "@/auth";
import { normalizeMgPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export type OrderFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  orderId?: string;
};

const schema = z.object({
  items: z
    .array(z.object({ slug: z.string().min(1), qty: z.number().int().positive().max(99) }))
    .min(1, "Votre panier est vide.")
    .max(50),
  customerName: z.string().trim().min(2, "Indiquez votre nom.").max(100),
  customerPhone: z.string().trim(),
  delivery: z.enum(["LIVRAISON", "RETRAIT"]),
  deliveryAddress: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "ESPECES"]),
  useCredits: z.boolean(),
});

class OrderError extends Error {}

export async function placeOrder(_prev: OrderFormState, formData: FormData): Promise<OrderFormState> {
  const session = await requireRole([...APP_ROLES], "/panier");

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Panier illisible, rechargez la page." };
  }

  const parsed = schema.safeParse({
    items,
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    delivery: formData.get("delivery"),
    deliveryAddress: formData.get("deliveryAddress") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    useCredits: formData.get("useCredits") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }
  const data = parsed.data;

  const phone = normalizeMgPhone(data.customerPhone);
  if (!phone) return { error: "Certains champs sont à corriger.", fieldErrors: { customerPhone: "Numéro mobile invalide (ex : 034 12 345 67)." } };
  if (data.delivery === "LIVRAISON" && (data.deliveryAddress?.length ?? 0) < 5) {
    return { error: "Certains champs sont à corriger.", fieldErrors: { deliveryAddress: "Indiquez l'adresse de livraison." } };
  }

  // Une ligne par produit, même si le navigateur en envoie plusieurs.
  const qtyBySlug = new Map<string, number>();
  for (const i of data.items) qtyBySlug.set(i.slug, Math.min(99, (qtyBySlug.get(i.slug) ?? 0) + i.qty));

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Prix et stock relus en base, jamais depuis le navigateur.
      const products = await tx.product.findMany({
        where: { slug: { in: [...qtyBySlug.keys()] }, published: true },
        select: { id: true, slug: true, name: true, price: true },
      });
      if (products.length !== qtyBySlug.size) throw new OrderError("Un produit n'est plus disponible : vérifiez votre panier.");

      // Réservation du stock : la décrémentation n'a lieu que si le stock suffit encore
      // (pas de survente même avec deux commandes simultanées ; la base refuse aussi un stock négatif).
      for (const p of products) {
        const qty = qtyBySlug.get(p.slug)!;
        const { count } = await tx.product.updateMany({ where: { id: p.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (count === 0) throw new OrderError(`Stock insuffisant pour « ${p.name} » : vérifiez votre panier.`);
      }

      const subtotal = products.reduce((s, p) => s + p.price * qtyBySlug.get(p.slug)!, 0);

      let creditsUsed = 0;
      if (data.useCredits) {
        const user = await tx.user.findUnique({ where: { id: session.user.id }, select: { creditBalance: true } });
        creditsUsed = Math.min(user?.creditBalance ?? 0, subtotal);
        if (creditsUsed > 0) {
          const { count } = await tx.user.updateMany({
            where: { id: session.user.id, creditBalance: { gte: creditsUsed } },
            data: { creditBalance: { decrement: creditsUsed } },
          });
          if (count === 0) throw new OrderError("Vos crédits ont changé, réessayez.");
        }
      }
      const toPay = subtotal - creditsUsed;

      return tx.order.create({
        data: {
          userId: session.user.id,
          customerName: data.customerName,
          customerPhone: phone,
          deliveryAddress: data.delivery === "LIVRAISON" ? data.deliveryAddress : null,
          total: toPay,
          creditsUsed,
          status: toPay === 0 ? "PAYEE" : "EN_ATTENTE_PAIEMENT",
          items: {
            create: products.map((p) => ({ productId: p.id, quantity: qtyBySlug.get(p.slug)!, unitPrice: p.price })),
          },
          // Paiement à confirmer : l'intégration de l'API MVola / Orange Money / Airtel Money viendra ensuite.
          payments: toPay > 0 ? { create: { method: data.paymentMethod, amount: toPay } } : undefined,
        },
        select: { id: true },
      });
    });

    updateTag("products"); // stock à jour immédiatement dans la boutique
    return { orderId: order.id };
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error("Commande impossible", e);
    return { error: "La commande n'a pas pu être enregistrée. Réessayez." };
  }
}
