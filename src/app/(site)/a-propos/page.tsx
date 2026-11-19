import type { Metadata } from "next";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <article className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-3xl font-bold">À propos de HOPE Services</h1>
      {/* TODO : remplacer par le texte de présentation de l'entreprise */}
      <p className="text-black/70">
        HOPE Services est une entreprise d&apos;Antananarivo spécialisée dans la collecte et la valorisation des
        déchets. Notre mission : réduire les déchets en ville tout en créant de la valeur pour ceux qui trient.
      </p>
    </article>
  );
}
