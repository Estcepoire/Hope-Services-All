import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

// Stockage des photos des déclarations. Deux modes, choisis automatiquement :
//  - Vercel Blob en accès privé si BLOB_READ_WRITE_TOKEN est défini (déploiement Vercel : pas de disque
//    permanent) ;
//  - disque du serveur sinon (local, Docker), hors de public/ : les fichiers ajoutés après le build n'y
//    seraient pas servis.
// Dans les deux cas, les photos sont servies par /api/uploads/… avec contrôle d'accès, et l'URL enregistrée
// en base est la même.

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
// turbopackIgnore : dossier de données lu à l'exécution, à ne pas embarquer dans le build.
const ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "uploads");

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const MAX_PHOTOS = 4;

export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES[file.type]) return "Format de photo non accepté (JPEG, PNG ou WebP).";
  if (file.size > MAX_PHOTO_BYTES) return "Une photo dépasse 3 Mo.";
  return null;
}

const key = (declarationId: string, name: string) => `declarations/${declarationId}/${name}`;

/** Enregistre une photo de déclaration et renvoie son URL de lecture. */
export async function saveDeclarationPhoto(declarationId: string, file: File) {
  const name = `${randomUUID()}.${PHOTO_TYPES[file.type]}`;
  if (USE_BLOB) {
    await put(key(declarationId, name), file, { access: "private", contentType: file.type, addRandomSuffix: false });
  } else {
    const dir = path.join(ROOT, "declarations", declarationId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  }
  return `/api/uploads/declarations/${declarationId}/${name}`;
}

export async function deleteDeclarationPhotos(declarationId: string) {
  if (USE_BLOB) {
    const { blobs } = await list({ prefix: `declarations/${declarationId}/` });
    if (blobs.length) await del(blobs.map((b) => b.url));
  } else {
    await rm(path.join(ROOT, "declarations", declarationId), { recursive: true, force: true });
  }
}

/** Lit une photo ; null si le nom est invalide ou le fichier absent. */
export async function readDeclarationPhoto(declarationId: string, name: string): Promise<{ body: BodyInit; type: string } | null> {
  // Noms générés par saveDeclarationPhoto uniquement : bloque toute remontée de dossier.
  if (!/^[a-z0-9]+$/i.test(declarationId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  const ext = name.split(".").pop()!;
  const type = Object.keys(PHOTO_TYPES).find((t) => PHOTO_TYPES[t] === ext)!;
  try {
    if (USE_BLOB) {
      const result = await get(key(declarationId, name), { access: "private" });
      return result?.stream ? { body: result.stream, type } : null;
    }
    const data = await readFile(path.join(ROOT, "declarations", declarationId, name));
    return { body: new Uint8Array(data), type };
  } catch {
    return null;
  }
}

// ─── Images des produits (publiques : affichées dans la boutique) ───────────────

export const MAX_PRODUCT_IMAGES = 6;

/** Enregistre une image produit et renvoie son URL publique. */
export async function saveProductImage(file: File) {
  const name = `${randomUUID()}.${PHOTO_TYPES[file.type]}`;
  if (USE_BLOB) {
    await put(`produits/${name}`, file, { access: "private", contentType: file.type, addRandomSuffix: false });
  } else {
    const dir = path.join(ROOT, "produits");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  }
  return `/api/uploads/produits/${name}`;
}

/** Supprime les fichiers d'images produit retirées (URL /api/uploads/produits/…). */
export async function deleteProductImages(urls: string[]) {
  const names = urls.map((u) => u.split("/").pop()!).filter((n) => /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(n));
  if (!names.length) return;
  if (USE_BLOB) {
    await del(names.map((n) => `produits/${n}`));
  } else {
    await Promise.all(names.map((n) => rm(path.join(ROOT, "produits", n), { force: true })));
  }
}

export async function readProductImage(name: string): Promise<{ body: BodyInit; type: string } | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  const type = Object.keys(PHOTO_TYPES).find((t) => PHOTO_TYPES[t] === name.split(".").pop())!;
  try {
    if (USE_BLOB) {
      const result = await get(`produits/${name}`, { access: "private" });
      return result?.stream ? { body: result.stream, type } : null;
    }
    return { body: new Uint8Array(await readFile(path.join(ROOT, "produits", name))), type };
  } catch {
    return null;
  }
}
