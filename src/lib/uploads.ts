import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Stockage des photos sur le disque du serveur (hors de public/ : les fichiers ajoutés après
// le build n'y seraient pas servis). Servies par /api/uploads/… avec contrôle d'accès.
// En production, prévoir un volume persistant, ou remplacer par un stockage objet (S3, R2…).

const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "uploads");

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

/** Enregistre une photo de déclaration et renvoie son URL de lecture. */
export async function saveDeclarationPhoto(declarationId: string, file: File) {
  const name = `${randomUUID()}.${PHOTO_TYPES[file.type]}`;
  const dir = path.join(ROOT, "declarations", declarationId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/declarations/${declarationId}/${name}`;
}

export async function deleteDeclarationPhotos(declarationId: string) {
  await rm(path.join(ROOT, "declarations", declarationId), { recursive: true, force: true });
}

/** Lit une photo ; null si le nom est invalide ou le fichier absent. */
export async function readDeclarationPhoto(declarationId: string, name: string) {
  // Noms générés par saveDeclarationPhoto uniquement : bloque toute remontée de dossier.
  if (!/^[a-z0-9]+$/i.test(declarationId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  try {
    const data = await readFile(path.join(ROOT, "declarations", declarationId, name));
    const ext = name.split(".").pop()!;
    const type = Object.keys(PHOTO_TYPES).find((t) => PHOTO_TYPES[t] === ext)!;
    return { data, type };
  } catch {
    return null;
  }
}
