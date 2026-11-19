import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { PAGE_SIZE, type SearchParams } from "@/lib/admin/list-params";

// Barre de recherche et de filtres de l'admin : formulaire GET classique (fonctionne sans JavaScript),
// filtres courants visibles, filtres supplémentaires dans « Recherche avancée ».

const input = "h-10 rounded border border-[#dfe7dc] bg-white px-3 text-sm focus:border-brand focus:outline-none";

export function ListToolbar({
  basePath,
  sp,
  placeholder,
  filters,
  advanced,
}: {
  basePath: string;
  sp: SearchParams;
  placeholder: string;
  filters?: React.ReactNode;
  advanced?: React.ReactNode;
}) {
  const q = typeof sp.q === "string" ? sp.q : "";
  const hasFilters = Object.entries(sp).some(([k, v]) => k !== "page" && v);
  const advancedOpen = Boolean(advanced) && Object.keys(sp).some((k) => !["q", "page", "statut"].includes(k) && sp[k]);

  return (
    <form method="get" action={basePath} className="mb-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Rechercher</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a978c]" />
          <input type="search" name="q" defaultValue={q} placeholder={placeholder} className={`${input} w-full pl-9`} />
        </label>
        {filters}
        <button className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">Filtrer</button>
        {hasFilters && (
          <Link href={basePath} className="flex h-10 items-center gap-1 rounded px-3 text-sm text-[#5b6b5e] hover:bg-brand-light">
            <X className="h-4 w-4" /> Réinitialiser
          </Link>
        )}
      </div>
      {advanced && (
        <details open={advancedOpen} className="group rounded border border-[#e6ece3] bg-[#fafcf9]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-brand-dark">
            <SlidersHorizontal className="h-4 w-4" /> Recherche avancée
          </summary>
          <div className="flex flex-wrap items-end gap-3 border-t border-[#e6ece3] p-3">{advanced}</div>
        </details>
      )}
    </form>
  );
}

export function SelectFilter({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-[#5b6b5e]">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value ?? ""} aria-label={label} className={input}>
        <option value="">{label} : tous</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function FieldFilter({ name, label, type = "text", value, placeholder }: { name: string; label: string; type?: string; value?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-[#5b6b5e]">
      {label}
      <input type={type} name={name} defaultValue={value ?? ""} placeholder={placeholder} className={input} />
    </label>
  );
}

/** Pagination numérotée qui conserve les filtres de l'URL. */
export function Pagination({ basePath, sp, page, total }: { basePath: string; sp: SearchParams; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (k !== "page" && typeof v === "string" && v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    return q.size ? `${basePath}?${q}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5b6b5e]">
      <p>
        {total === 0 ? "Aucun résultat" : `${from}–${to} sur ${total} résultat${total > 1 ? "s" : ""}`}
      </p>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <PageLink href={href(page - 1)} disabled={page <= 1} label="Page précédente"><ChevronLeft className="h-4 w-4" /></PageLink>
          {numbers.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - numbers[i - 1] > 1 && <span className="px-1">…</span>}
              <PageLink href={href(p)} active={p === page} label={`Page ${p}`}>{p}</PageLink>
            </span>
          ))}
          <PageLink href={href(page + 1)} disabled={page >= pages} label="Page suivante"><ChevronRight className="h-4 w-4" /></PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({ href, children, active, disabled, label }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; label: string }) {
  const cls = "grid h-9 min-w-9 place-items-center rounded border px-2";
  if (disabled) return <span aria-disabled className={`${cls} border-[#e6ece3] text-[#c2cbc3]`}>{children}</span>;
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={`${cls} ${active ? "border-brand bg-brand text-white" : "border-[#e6ece3] bg-white hover:border-brand hover:text-brand"}`}>
      {children}
    </Link>
  );
}
