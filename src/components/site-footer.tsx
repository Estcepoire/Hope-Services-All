import Link from "next/link";
import { Logo } from "@/components/site-header";
import { COMPANY } from "@/lib/company";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-foreground text-white/80">
      <div className="mx-auto grid max-w-[1920px] gap-8 px-4 py-12 sm:px-8 lg:px-12 text-sm sm:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-2xl bg-white p-3"><Logo className="h-10 w-auto" /></span>
          <p className="max-w-xs">{COMPANY.description}</p>
          <p className="font-[family-name:var(--font-display)] text-lg italic text-highlight">« {COMPANY.slogan} »</p>
          <ul className="flex flex-col gap-1">
            <li className="flex items-center gap-2"><MapPin aria-hidden className="h-4 w-4 shrink-0" /> {COMPANY.address}</li>
            <li><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white"><Phone aria-hidden className="h-4 w-4 shrink-0" /> {COMPANY.phone}</a></li>
            <li><a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-white"><Mail aria-hidden className="h-4 w-4 shrink-0" /> {COMPANY.email}</a></li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white">Recycler</p>
          <Link href="/collecte/points" className="hover:text-white">Points d&apos;apport</Link>
          <Link href="/collecte/declarer" className="hover:text-white">Demander un enlèvement</Link>
          <Link href="/collecte/estimer" className="hover:text-white">Estimer mes déchets</Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white">HOPE Services</p>
          <Link href="/boutique" className="hover:text-white">Boutique verte</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <a href="https://www.facebook.com/hopeservices.sarlu/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Facebook
          </a>
        </div>
      </div>
      <p className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {COMPANY.name} {COMPANY.legalForm}, {COMPANY.city}
      </p>
    </footer>
  );
}
