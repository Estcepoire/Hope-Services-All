"use client";

import { ImagePlus, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProduct, type ProductFormState } from "@/lib/actions/admin/products";
import { compressPhoto } from "@/lib/image-compress";
import { CATEGORY_LABELS } from "@/lib/labels";

type Product = {
  id: string;
  name: string;
  description: string;
  category: keyof typeof CATEGORY_LABELS;
  price: number;
  stock: number;
  recycledKg: number | null;
  published: boolean;
  images: string[];
};

const MAX_IMAGES = 6;
const input = "w-full rounded border border-[#dfe7dc] bg-white p-2.5 text-sm focus:border-brand focus:outline-none";

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "MAISON",
    price: String(product?.price ?? ""),
    stock: String(product?.stock ?? "0"),
    recycledKg: product?.recycledKg != null ? String(product.recycledKg) : "",
    published: product?.published ?? true,
  });
  const [kept, setKept] = useState<string[]>(product?.images ?? []);
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const err = state.fieldErrors ?? {};
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  async function addImages(files: FileList | null) {
    if (!files) return;
    setImageError(null);
    const room = MAX_IMAGES - kept.length - added.length;
    if (files.length > room) setImageError(`${MAX_IMAGES} images maximum.`);
    try {
      const next = await Promise.all([...files].slice(0, room).map(async (file) => {
        const small = await compressPhoto(file);
        return { file: small, url: URL.createObjectURL(small) };
      }));
      setAdded((a) => [...a, ...next]);
    } catch {
      setImageError("Une image n'a pas pu être lue.");
    }
  }

  return (
    <form
      action={(fd) => {
        kept.forEach((u) => fd.append("keepImages", u));
        added.forEach((a) => fd.append("images", a.file));
        return action(fd);
      }}
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="flex flex-col gap-4">
        <Field label="Nom du produit" error={err.name}>
          <input name="name" value={f.name} onChange={set("name")} required className={input} />
        </Field>
        <Field label="Description" error={err.description}>
          <textarea name="description" value={f.description} onChange={set("description")} rows={5} required className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie">
            <select name="category" value={f.category} onChange={set("category")} className={input}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Matière recyclée par exemplaire (kg)" error={err.recycledKg}>
            <input name="recycledKg" type="number" step="0.01" min="0" value={f.recycledKg} onChange={set("recycledKg")} className={input} />
          </Field>
          <Field label="Prix (Ar)" error={err.price}>
            <input name="price" type="number" min="0" step="1" required value={f.price} onChange={set("price")} className={input} />
          </Field>
          <Field label="Stock" error={err.stock}>
            <input name="stock" type="number" min="0" step="1" required value={f.stock} onChange={set("stock")} className={input} />
          </Field>
        </div>

        <Field label={`Images (${kept.length + added.length}/${MAX_IMAGES}) — la première sert de vignette`} error={err.images ?? imageError ?? undefined}>
          <div className="flex flex-wrap gap-3">
            {kept.map((url) => (
              <Thumb key={url} src={url} onRemove={() => setKept((k) => k.filter((u) => u !== url))} />
            ))}
            {added.map((a) => (
              <Thumb key={a.url} src={a.url} onRemove={() => { URL.revokeObjectURL(a.url); setAdded((x) => x.filter((y) => y.url !== a.url)); }} />
            ))}
            {kept.length + added.length < MAX_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[#cfdccb] text-xs text-[#5b6b5e] hover:border-brand">
                <ImagePlus aria-hidden className="mb-1 h-6 w-6" strokeWidth={1.5} />
                Ajouter
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
        </Field>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded border border-[#e6ece3] bg-[#fafcf9] p-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" checked={f.published} onChange={(e) => setF((v) => ({ ...v, published: e.target.checked }))} />
          Visible dans la boutique
        </label>
        {state.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : product ? "Enregistrer les modifications" : "Créer le produit"}
        </button>
        <Link href="/admin/produits" className="text-center text-sm text-[#5b6b5e] hover:text-brand">Annuler</Link>
      </aside>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-brand-dark">{label}</span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element -- aperçu (blob: ou image déjà enregistrée) */}
      <img src={src} alt="" className="h-24 w-24 rounded object-cover" />
      <button type="button" onClick={onRemove} aria-label="Retirer l'image" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white shadow">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
