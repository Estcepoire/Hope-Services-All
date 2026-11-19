import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Accès refusé", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl font-bold">Accès refusé</h1>
      <p className="text-black/70">Votre compte n&apos;a pas les droits nécessaires pour cette page.</p>
      <Link href="/compte" className="text-brand underline">Retour à mon compte</Link>
    </div>
  );
}
