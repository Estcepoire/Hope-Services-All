import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { Recycle, Trash2, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos",
  description: "HOPE Services, Antananarivo : collecte et vente de déchets recyclables. Serving is our nature.",
};

// Constat, problèmes et solution : repris de la bannière de HOPE Services (stand, page Facebook).
const DIAGNOSIS = [
  { label: "Les faits", Icon: Trash2, items: ["Des déchets dans les rues", "Une insuffisance d'infrastructures de traitement spécialisées"] },
  { label: "Les problèmes", Icon: TriangleAlert, items: ["L'augmentation de l'insalubrité dans les rues", "La pollution de l'air"] },
  { label: "Notre solution", Icon: Recycle, items: ["Un service de revalorisation des déchets", "La collecte et la vente de déchets recyclables"] },
];

// Objectifs de développement durable (ONU) affichés sur la bannière de HOPE Services.
const SDGS = [
  { n: 3, label: "Bonne santé et bien-être", color: "bg-[#4c9f38]" },
  { n: 8, label: "Travail décent et croissance économique", color: "bg-[#a21942]" },
  { n: 11, label: "Villes et communautés durables", color: "bg-[#fd9d24]" },
  { n: 13, label: "Lutte contre le changement climatique", color: "bg-[#3f7e44]" },
];

const STREAMS = [
  { label: "Biodégradable", color: "bg-orange-500" },
  { label: "Aluminium", color: "bg-red-600" },
  { label: "Plastique", color: "bg-green-700" },
  { label: "Carton", color: "bg-blue-600" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-24">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">À propos</span>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.95] sm:text-7xl">
          <span className="text-accent">Serving</span> is our nature
        </h1>
        <p className="max-w-2xl text-lg text-black/70">
          {COMPANY.name} {COMPANY.legalForm} est une entreprise de gestion des déchets basée à Andoharanofotsy,
          Antananarivo. {COMPANY.description}
        </p>
      </section>

      <figure className="relative -mt-12 aspect-[960/365] overflow-hidden rounded-[2.5rem] bg-[#ece7e4]">
        <Image src="/images/hope/couverture.png" alt="Logo HOPE Services et slogan « Serving is our nature »" fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
      </figure>

      <section className="flex flex-col gap-8">
        <h2 className="max-w-2xl text-3xl font-extrabold sm:text-5xl">Pourquoi HOPE Services existe</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {DIAGNOSIS.map((d, i) => (
            <div key={d.label} className={`flex flex-col gap-4 rounded-[2rem] p-7 ${i === 2 ? "bg-brand text-white" : "bg-surface"}`}>
              <d.Icon aria-hidden className={`h-9 w-9 ${i === 2 ? "text-highlight" : "text-brand"}`} strokeWidth={1.6} />
              <h3 className="text-2xl font-extrabold">{d.label}</h3>
              <ul className={`flex flex-col gap-2 ${i === 2 ? "text-white/85" : "text-black/70"}`}>
                {d.items.map((it) => <li key={it}>• {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-10 md:grid-cols-2">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image
            src="/images/hope/stand-salon.jpg"
            alt="L'équipe HOPE Services sur son stand, avec ses bannières et ses poubelles de tri"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[45%_50%]"
          />
        </figure>
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Sur le terrain</span>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Le tri commence par quatre poubelles</h2>
          <p className="text-lg text-black/70">
            Sur nos stands et lors de nos actions de sensibilisation, nous montrons comment séparer les déchets en
            quatre flux. Un déchet bien trié se recycle mieux et se revend mieux.
          </p>
          <div className="flex flex-wrap gap-2">
            {STREAMS.map((s) => (
              <span key={s.label} className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${s.color}`}>{s.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="full-bleed rounded-t-[3rem] bg-surface px-4 sm:px-8 lg:px-12 py-16 sm:rounded-t-[5rem]">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold sm:text-5xl">Notre contribution aux ODD</h2>
            <p className="mt-3 text-black/70">Les objectifs de développement durable des Nations unies auxquels nous contribuons.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SDGS.map((g) => (
              <div key={g.n} className={`flex aspect-square flex-col justify-between rounded-3xl p-6 text-white ${g.color}`}>
                <span className="font-[family-name:var(--font-display)] text-6xl font-extrabold">{g.n}</span>
                <span className="text-lg font-bold uppercase leading-tight">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-[2rem] bg-brand p-8 text-white sm:p-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Vous avez des déchets à valoriser ?</h2>
          <p className="text-white/80">Estimez leur valeur, puis déposez-les ou faites-les enlever.</p>
          <Link href="/collecte/estimer" className="mt-auto w-fit rounded-full bg-white px-5 py-3 font-semibold text-brand">Estimer mes déchets</Link>
        </div>
        <div className="flex flex-col gap-4 rounded-[2rem] bg-sand p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Entreprise, ONG, commune ?</h2>
          <p className="text-black/70">Collecte régulière, sensibilisation, stands : travaillons ensemble.</p>
          <Link href="/contact" className="mt-auto w-fit rounded-full bg-foreground px-5 py-3 font-semibold text-white">Nous contacter</Link>
        </div>
      </section>
    </div>
  );
}
