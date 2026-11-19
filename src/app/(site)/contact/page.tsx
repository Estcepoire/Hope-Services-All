import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <article className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-3xl font-bold">Contact</h1>
      {/* TODO : ajouter téléphone, e-mail, adresse du dépôt et formulaire de contact */}
      <p className="text-black/70">Antananarivo, Madagascar</p>
      <a
        href="https://www.facebook.com/hopeservices.sarlu/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand underline"
      >
        Écrivez-nous sur Facebook
      </a>
    </article>
  );
}
