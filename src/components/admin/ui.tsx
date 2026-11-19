import type { LucideIcon } from "lucide-react";
import Link from "next/link";

// Briques d'interface de l'admin : structure NiceAdmin, couleurs du thème HOPE (blanc et vert).

export function PageTitle({ title, crumbs = [] }: { title: string; crumbs?: string[] }) {
  return (
    <div className="mb-6">
      <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold tracking-normal text-brand-dark">{title}</h1>
      <nav aria-label="Fil d'Ariane" className="mt-1 text-sm text-[#8a978c]">
        <Link href="/admin" className="hover:text-brand">Accueil</Link>
        {crumbs.map((c) => (
          <span key={c}>
            <span className="mx-2">/</span>
            <span className="text-[#5b6b5e]">{c}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}

export function Card({ title, subtitle, children, className = "" }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md bg-white p-5 shadow-[0_0_30px_rgba(31,107,58,0.08)] ${className}`}>
      {title && (
        <h2 className="mb-4 font-[family-name:var(--font-poppins)] text-lg font-medium tracking-normal text-brand-dark">
          {title}
          {subtitle && <span className="font-normal text-[#8a978c]"> | {subtitle}</span>}
        </h2>
      )}
      {children}
    </section>
  );
}

const TONES = {
  green: { icon: "bg-brand-light text-brand", circle: "bg-brand/5" },
  lime: { icon: "bg-[#eef6e4] text-accent", circle: "bg-accent/5" },
  yellow: { icon: "bg-[#fdf4dc] text-[#b98400]", circle: "bg-highlight/10" },
  dark: { icon: "bg-[#ecefeb] text-foreground", circle: "bg-foreground/5" },
} as const;

/** Carte de chiffre clé : pastille d'icône teintée, libellé, grand nombre, cercle décoratif. */
export function KpiCard({ label, value, hint, Icon, tone = "green", href }: { label: string; value: string; hint?: string; Icon: LucideIcon; tone?: keyof typeof TONES; href?: string }) {
  const t = TONES[tone];
  const body = (
    <div className="relative h-full overflow-hidden rounded-md bg-white p-5 shadow-[0_0_30px_rgba(31,107,58,0.08)] transition hover:shadow-[0_0_30px_rgba(31,107,58,0.16)]">
      <span aria-hidden className={`absolute -right-10 -top-10 h-36 w-36 rounded-full ${t.circle}`} />
      <p className="font-[family-name:var(--font-poppins)] text-sm font-medium text-[#8a978c]">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <span aria-hidden className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${t.icon}`}>
          <Icon className="h-7 w-7" />
        </span>
        <div>
          <p className="font-[family-name:var(--font-poppins)] text-[28px] font-bold leading-tight text-brand-dark">{value}</p>
          {hint && <p className="text-sm text-[#8a978c]">{hint}</p>}
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

/** Tableau sobre façon NiceAdmin (en-têtes foncés, lignes séparées). */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6ece3] text-brand-dark">
            {head.map((h, i) => (
              <th key={h} className={`px-2 py-3 font-semibold ${i === head.length - 1 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2 [&_td]:py-3 [&_tr]:border-b [&_tr]:border-[#e6ece3]">{children}</tbody>
      </table>
    </div>
  );
}
