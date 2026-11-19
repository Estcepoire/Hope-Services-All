import Link from "next/link";

// Accès réservé au rôle admin : vérifié par requireRole() dans chaque composant qui lit des données
// (un layout ne se ré-exécute pas à chaque navigation, il ne suffit donc pas comme garde).

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/collectes", label: "Collectes" },
  { href: "/admin/tarifs", label: "Tarifs" },
  { href: "/admin/produits", label: "Produits" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-black/10 bg-brand-light p-4 md:w-56 md:border-b-0 md:border-r">
        <p className="mb-4 font-bold text-brand">HOPE · Admin</p>
        <nav className="flex gap-3 text-sm md:flex-col">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">{l.label}</Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
