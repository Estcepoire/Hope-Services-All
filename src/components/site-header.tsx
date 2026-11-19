import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, LoginLink } from "@/components/account-link";

const links = [
  { href: "/boutique", label: "Boutique" },
  { href: "/collecte", label: "Collecte" },
  { href: "/collecte/estimer", label: "Estimer mes déchets" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand">
          HOPE Services
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
          <Suspense fallback={<LoginLink />}>
            <AccountLink />
          </Suspense>
          <Link href="/panier" className="rounded-full bg-brand px-3 py-1 text-white hover:bg-brand-dark">
            Panier
          </Link>
        </nav>
      </div>
    </header>
  );
}
