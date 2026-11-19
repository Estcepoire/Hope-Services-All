"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { deleteProductImages, MAX_PRODUCT_IMAGES, saveProductImage, validatePhoto } from "@/lib/uploads";

export type ProductFormState = { error?: string; fieldErrors?: Partial<Record<string, string>> };

const schema = z.object({
  name: z.string().trim().min(3, "Nom trop court.").max(120),
  description: z.string().trim().min(10, "Ajoutez une description (10 caractères minimum).").max(2000),
  category: z.enum(["MAISON", "MODE", "CONSTRUCTION", "PAPETERIE", "AUTRE"]),
  price: z.coerce.number().int("Prix en Ariary, sans décimales.").min(0).max(100_000_000),
  stock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif.").max(1_000_000),
  recycledKg: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().max(10_000).optional()),
  published: z.boolean(),
});

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "produit";
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
  }
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireRole(["admin"], "/admin/produits");
  const id = (formData.get("id") as string) || undefined;

  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    recycledKg: formData.get("recycledKg"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Certains champs sont à corriger.", fieldErrors };
  }

  const existing = id ? await prisma.product.findUnique({ where: { id }, select: { images: true } }) : null;
  if (id && !existing) return { error: "Ce produit n'existe plus." };

  // Images gardées : uniquement parmi celles déjà enregistrées (jamais une URL fournie par le navigateur).
  const kept = (formData.getAll("keepImages") as string[]).filter((u) => existing?.images.includes(u));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (kept.length + files.length > MAX_PRODUCT_IMAGES) return { fieldErrors: { images: `${MAX_PRODUCT_IMAGES} images maximum.` } };
  for (const f of files) {
    const err = validatePhoto(f);
    if (err) return { fieldErrors: { images: err } };
  }

  const added = await Promise.all(files.map((f) => saveProductImage(f)));
  const data = { ...parsed.data, recycledKg: parsed.data.recycledKg ?? null, images: [...kept, ...added] };

  try {
    if (id) {
      await prisma.product.update({ where: { id }, data: { ...data, slug: await uniqueSlug(data.name, id) } });
      await deleteProductImages(existing!.images.filter((u) => !kept.includes(u)));
    } else {
      await prisma.product.create({ data: { ...data, slug: await uniqueSlug(data.name) } });
    }
  } catch (e) {
    await deleteProductImages(added); // ne pas laisser de fichiers orphelins
    console.error("Enregistrement du produit impossible", e);
    return { error: "Le produit n'a pas pu être enregistré." };
  }

  updateTag("products");
  redirect(`/admin/produits?ok=${id ? "modifie" : "cree"}`);
}

export async function deleteProduct(formData: FormData) {
  await requireRole(["admin"], "/admin/produits");
  const id = String(formData.get("id"));
  const product = await prisma.product.findUnique({ where: { id }, select: { images: true, _count: { select: { orderItems: true } } } });
  if (!product) redirect("/admin/produits");

  // Un produit déjà commandé reste en base (historique des commandes) : on le retire seulement de la boutique.
  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { published: false } });
    updateTag("products");
    redirect("/admin/produits?ok=depublie");
  }

  await prisma.product.delete({ where: { id } });
  await deleteProductImages(product.images);
  updateTag("products");
  redirect("/admin/produits?ok=supprime");
}
