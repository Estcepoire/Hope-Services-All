import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Logo } from "@/components/site-header";
import { COMPANY, type Company } from "@/lib/company";
import { getCompany } from "@/lib/data";

/** Pied de page : coordonnées des paramètres de l'admin, avec les valeurs par défaut en attendant. */
export function SiteFooter() {
  return (
    <Suspense fallback={<FooterView company={COMPANY} />}>
      <FooterWithSettings />
    </Suspense>
  );
}

async function FooterWithSettings() {
  await connection(); // lu à la requête (puis mis en cache) : le build n'a pas besoin de la base
  return <FooterView company={await getCompany()} />;
}

function FooterView({ company }: { company: Company }) {
  return (
    <footer className="mt-auto bg-foreground text-white/80">
      <div className="mx-auto grid max-w-[1920px] gap-8 px-4 py-12 text-sm sm:grid-cols-[2fr_1fr_1fr] sm:px-8 lg:px-12">
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-2xl bg-white p-3"><Logo className="h-10 w-auto" /></span>
          <p className="max-w-xs">{company.description}</p>
          <p className="font-[family-name:var(--font-display)] text-lg italic text-highlight">« {company.slogan} »</p>
          <ul className="flex flex-col gap-1">
            {company.address && <li className="flex items-center gap-2"><MapPin aria-hidden className="h-4 w-4 shrink-0" /> {company.address}</li>}
            {company.phone && (
              <li><a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white"><Phone aria-hidden className="h-4 w-4 shrink-0" /> {company.phone}</a></li>
            )}
            {company.email && (
              <li><a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-white"><Mail aria-hidden className="h-4 w-4 shrink-0" /> {company.email}</a></li>
            )}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Recycler</p>
          <Link href="/collecte/points" className="hover:text-white">Points d&apos;apport</Link>
          <Link href="/collecte/declarer" className="hover:text-white">Demander un enlèvement</Link>
          <Link href="/collecte/estimer" className="hover:text-white">Estimer mes déchets</Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white">{company.name}</p>
          <Link href="/boutique" className="hover:text-white">Boutique verte</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {company.name} {company.legalForm}, {company.city}
      </p>
    </footer>
  );
}
