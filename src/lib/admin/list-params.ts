// Lecture des paramètres de liste de l'admin (?q=…&statut=…&page=…) : filtres et pagination passent par
// l'URL, donc les listes filtrées sont partageables et fonctionnent sans JavaScript.

export const PAGE_SIZE = 20;

export type SearchParams = Record<string, string | string[] | undefined>;

/** Première valeur d'un paramètre, nettoyée et bornée (évite les requêtes démesurées). */
export function str(sp: SearchParams, key: string, max = 100): string | undefined {
  const raw = sp[key];
  const v = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return v ? v.slice(0, max) : undefined;
}

/** Valeur parmi une liste fermée (enum Prisma), sinon undefined. */
export function oneOf<T extends string>(sp: SearchParams, key: string, values: readonly T[]): T | undefined {
  const v = str(sp, key);
  return values.find((x) => x === v);
}

/** Date au format AAAA-MM-JJ ; `endOfDay` pour une borne « jusqu'au » incluse. */
export function dateParam(sp: SearchParams, key: string, endOfDay = false): Date | undefined {
  const v = str(sp, key, 10);
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

/** Entier positif (montants, poids…), sinon undefined. */
export function intParam(sp: SearchParams, key: string): number | undefined {
  const v = str(sp, key, 12);
  const n = v ? Number(v.replace(/\s/g, "")) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function pageParams(sp: SearchParams) {
  const page = Math.max(1, Math.min(10_000, intParam(sp, "page") ?? 1));
  return { page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** Plage de dates Prisma { gte, lte } à partir de ?du=…&au=… */
export function dateRange(sp: SearchParams, from = "du", to = "au") {
  const gte = dateParam(sp, from);
  const lte = dateParam(sp, to, true);
  return gte || lte ? { ...(gte && { gte }), ...(lte && { lte }) } : undefined;
}

// ─── Tri par colonne (?tri=…&ordre=asc|desc) ──────────────────────────────────

export type SortDir = "asc" | "desc";
export type Sort<K extends string> = { key: K; dir: SortDir };

/** Colonne de tri parmi une liste autorisée (jamais un nom de champ arbitraire venant de l'URL). */
export function sortParams<K extends string>(sp: SearchParams, keys: readonly K[], fallback: Sort<K>): Sort<K> {
  // Menu de tri des listes en cartes : ?triOrdre=cle:asc ; en-têtes de tableau : ?tri=cle&ordre=asc
  const [k2, o2] = (str(sp, "triOrdre") ?? "").split(":");
  const key = keys.find((k) => k === k2) ?? oneOf(sp, "tri", keys);
  const ordre = (["asc", "desc"] as const).find((o) => o === o2) ?? oneOf(sp, "ordre", ["asc", "desc"] as const);
  if (!key) return fallback;
  return { key, dir: ordre ?? "asc" };
}
