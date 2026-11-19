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

/** Nombre de filtres actifs (hors pagination), pour l'affichage. */
export function activeFilters(sp: SearchParams) {
  return Object.entries(sp).filter(([k, v]) => k !== "page" && v !== undefined && v !== "").length;
}
