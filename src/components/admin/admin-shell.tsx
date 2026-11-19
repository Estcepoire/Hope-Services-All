"use client";

import {
  ChartPie,
  ClipboardList,
  ExternalLink,
  LogOut,
  Mail,
  Menu,
  Package,
  ReceiptText,
  Tags,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";

// Coquille de l'espace admin : structure de NiceAdmin (BootstrapMade) — barre du haut, barre latérale
// blanche par sections — avec le blanc et le vert du thème HOPE Services.

const NAV: { section: string; items: { href: string; label: string; Icon: LucideIcon }[] }[] = [
  { section: "", items: [{ href: "/admin", label: "Tableau de bord", Icon: ChartPie }] },
  {
    section: "Activité",
    items: [
      { href: "/admin/collectes", label: "Collectes", Icon: Truck },
      { href: "/admin/commandes", label: "Commandes", Icon: ReceiptText },
      { href: "/admin/messages", label: "Messages", Icon: Mail },
    ],
  },
  {
    section: "Catalogue",
    items: [
      { href: "/admin/produits", label: "Produits", Icon: Package },
      { href: "/admin/tarifs", label: "Tarifs de rachat", Icon: Tags },
    ],
  },
  { section: "Terrain", items: [{ href: "/collecteur", label: "Espace collecteur", Icon: ClipboardList }] },
];

export function AdminShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f8f2] font-[family-name:var(--font-nunito)] text-[#444444]">
      <header className="fixed inset-x-0 top-0 z-[1001] flex h-[60px] items-center gap-4 bg-white px-4 shadow-[0_2px_20px_rgba(31,107,58,0.08)]">
        <Link href="/admin" className="flex items-center gap-2 lg:w-[268px]">
          <Image src="/images/hope/logo.png" alt="HOPE Services" width={197} height={97} className="h-8 w-auto" />
          <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-brand-dark">Admin</span>
        </Link>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className="text-brand-dark lg:hidden">
          <Menu className="h-6 w-6" />
        </button>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="hidden items-center gap-1 text-sm text-brand-dark hover:text-brand sm:flex">
            Voir le site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <span className="flex items-center gap-2">
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{initials}</span>
            <span className="hidden font-[family-name:var(--font-poppins)] text-sm font-semibold text-brand-dark sm:inline">{userName}</span>
          </span>
          <form action={logout}>
            <button aria-label="Se déconnecter" title="Se déconnecter" className="text-brand-dark hover:text-brand">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-[60px] z-[1000] w-[300px] overflow-y-auto bg-white p-5 shadow-[0_0_20px_rgba(31,107,58,0.08)] transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1">
          {NAV.map((group) => (
            <div key={group.section || "main"} className="flex flex-col gap-1">
              {group.section && (
                <p className="mt-4 px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8a978c]">{group.section}</p>
              )}
              {group.items.map(({ href, label, Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded px-4 py-2.5 font-[family-name:var(--font-poppins)] text-[15px] font-semibold transition ${
                      active ? "bg-brand-light text-brand" : "text-brand-dark hover:bg-[#f5f8f2] hover:text-brand"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${active ? "text-brand" : "text-[#8a978c]"}`} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      {open && <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-[999] bg-black/20 lg:hidden" />}

      <main className="px-4 pb-10 pt-[80px] sm:px-6 lg:ml-[300px] lg:px-8">{children}</main>
    </div>
  );
}
