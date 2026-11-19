import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-brand-light">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <p className="font-semibold text-brand">HOPE Services</p>
          <p className="mt-1 text-black/70">Collecte, recyclage et produits recyclés à Antananarivo.</p>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/collecte/points" className="hover:text-brand">Points d&apos;apport</Link>
          <Link href="/collecte/declarer" className="hover:text-brand">Demander un enlèvement</Link>
          <Link href="/boutique" className="hover:text-brand">Boutique verte</Link>
        </div>
        <div className="flex flex-col gap-1">
          <a href="https://www.facebook.com/hopeservices.sarlu/" target="_blank" rel="noopener noreferrer" className="hover:text-brand">
            Facebook
          </a>
          <Link href="/contact" className="hover:text-brand">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
