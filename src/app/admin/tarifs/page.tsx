import { CircleAlert, CircleCheck } from "lucide-react";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ListToolbar, Pagination, SelectFilter, SortSelectFilter } from "@/components/admin/list-toolbar";
import { Card, PageTitle } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import type { MaterialCategory } from "@/generated/prisma/enums";
import { oneOf, pageParams, sortParams, str, type SortDir } from "@/lib/admin/list-params";
import { deleteMaterial, saveMaterial } from "@/lib/actions/admin/materials";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  PLASTIQUE: "Plastique",
  PAPIER_CARTON: "Papier / carton",
  METAL: "Métal",
  VERRE: "Verre",
  ELECTRONIQUE: "Électronique",
  TEXTILE: "Textile",
  ORGANIQUE: "Organique",
  AUTRE: "Autre",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as MaterialCategory[];

const SORTS = {
  code: (dir: SortDir) => ({ code: dir }),
  nom: (dir: SortDir) => ({ name: dir }),
  categorie: (dir: SortDir) => ({ category: dir }),
  prix: (dir: SortDir) => ({ pricePerKg: dir }),
  actif: (dir: SortDir) => ({ active: dir }),
} satisfies Record<string, (dir: SortDir) => Prisma.MaterialOrderByWithRelationInput>;
type SortKey = keyof typeof SORTS;
const SORT_LABELS: Record<SortKey, string> = { code: "Code", nom: "Nom", categorie: "Catégorie", prix: "Prix au kilo", actif: "Actif" };
const input = "h-9 rounded border border-[#dfe7dc] bg-white px-2 text-sm focus:border-brand focus:outline-none";

export default function PricesPage(props: PageProps<"/admin/tarifs">) {
  return (
    <>
      <PageTitle title="Tarifs de rachat" crumbs={["Tarifs de rachat"]} />
      <Suspense fallback={<p>Chargement…</p>}>
        <Prices {...props} />
      </Suspense>
    </>
  );
}

async function Prices({ searchParams }: PageProps<"/admin/tarifs">) {
  await requireRole(["admin"], "/admin/tarifs");
  const sp = await searchParams;
  const q = str(sp, "q");
  const categorie = oneOf(sp, "categorie", CATEGORIES);
  const etat = oneOf(sp, "etat", ["actif", "inactif"] as const);
  const ok = str(sp, "ok", 300);
  const erreur = str(sp, "erreur", 300);
  const sort = sortParams(sp, Object.keys(SORTS) as SortKey[], { key: "categorie", dir: "asc" });
  const { page, skip, take } = pageParams(sp);
  const listSp = { ...sp, ok: undefined, erreur: undefined };

  const where: Prisma.MaterialWhereInput = {
    ...(categorie && { category: categorie }),
    ...(etat && { active: etat === "actif" }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { code: { contains: q, mode: "insensitive" } }] }),
  };
  const [total, materials] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({ where, orderBy: [SORTS[sort.key](sort.dir), { name: "asc" }], skip, take }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {ok && <p role="status" className="flex items-center gap-2 rounded bg-brand-light p-3 text-sm text-brand-dark"><CircleCheck className="h-4 w-4" /> {ok}</p>}
      {erreur && <p role="alert" className="flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {erreur}</p>}

      <Card title="Prix au kilo" subtitle="modifiables directement">
        <ListToolbar
          basePath="/admin/tarifs"
          sp={listSp}
          placeholder="Nom ou code…"
          filters={
            <>
              <SelectFilter name="categorie" label="Catégorie" value={categorie} options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
              <SelectFilter name="etat" label="État" value={etat} options={[{ value: "actif", label: "Actifs" }, { value: "inactif", label: "Désactivés" }]} />
              <SortSelectFilter sp={listSp} options={(Object.keys(SORTS) as SortKey[]).map((k) => ({ value: k, label: SORT_LABELS[k] }))} />
            </>
          }
        />
        {materials.length === 0 ? (
          <p className="py-6 text-center text-[#8a978c]">Aucun matériau ne correspond.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[#e6ece3]">
            {materials.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <form action={saveMaterial} className="flex flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <span className="w-20 font-mono text-xs font-semibold text-[#5b6b5e]">{m.code}</span>
                  <input name="name" defaultValue={m.name} required aria-label="Nom" className={`${input} min-w-[200px] flex-1`} />
                  <select name="category" defaultValue={m.category} aria-label="Catégorie" className={input}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input name="pricePerKg" type="number" min="0" step="1" defaultValue={m.pricePerKg} required aria-label="Prix au kilo" className={`${input} w-28 text-right`} />
                    Ar/kg
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="active" defaultChecked={m.active} /> Actif
                  </label>
                  <button className="h-9 rounded bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark">Enregistrer</button>
                </form>
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message={`Supprimer « ${m.name} » ? S'il a déjà servi dans une collecte, il sera seulement désactivé.`} className="h-9 rounded border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                    Supprimer
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <Pagination basePath="/admin/tarifs" sp={listSp} page={page} total={total} />
      </Card>

      <Card title="Ajouter un matériau">
        <form action={saveMaterial} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">Code<input name="code" required placeholder="ex. PP" className={`${input} w-28 uppercase`} /></label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">Nom<input name="name" required placeholder="ex. Pots de yaourt (PP)" className={`${input} min-w-[220px]`} /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Catégorie
            <select name="category" className={input}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Prix (Ar/kg)<input name="pricePerKg" type="number" min="0" step="1" required className={`${input} w-28`} /></label>
          <input type="hidden" name="active" value="on" />
          <button className="h-9 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">Ajouter</button>
        </form>
      </Card>
    </div>
  );
}
