import { Menu, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, LoginLink } from "@/components/account-link";

const links = [
  { href: "/boutique", label: "Boutique" },
  { href: "/collecte", label: "Collecte" },
  { href: "/collecte/estimer", label: "Estimer" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Link href="/" aria-label="HOPE Services, accueil" className="shrink-0">
      <Image src="/images/hope/logo.png" alt="HOPE Services" width={197} height={97} priority className={className} />
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-black/5 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-12">
        <Logo />

        <nav className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-wider md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="hidden sm:inline">
            <Suspense fallback={<LoginLink />}>
              <AccountLink />
            </Suspense>
          </span>
          <Link href="/panier" aria-label="Panier" className="grid h-10 w-10 place-items-center rounded-full border border-black/15 hover:border-brand">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/collecte/declarer" className="hidden rounded-full bg-foreground px-4 py-2.5 text-white hover:bg-brand sm:inline-block">
            Faire collecter
          </Link>

          {/* Menu mobile sans JavaScript */}
          <details className="relative md:hidden">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-black/15" aria-label="Menu">
              <Menu className="h-[18px] w-[18px]" />
            </summary>
            <nav className="absolute right-0 mt-2 flex w-56 flex-col gap-1 rounded-2xl bg-surface p-3 shadow-lg">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 hover:bg-brand-light">
                  {l.label}
                </Link>
              ))}
              <Link href="/collecte/declarer" className="rounded-lg px-3 py-2 hover:bg-brand-light">Faire collecter</Link>
              <span className="rounded-lg px-3 py-2 hover:bg-brand-light">
                <Suspense fallback={<LoginLink />}>
                  <AccountLink />
                </Suspense>
              </span>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
