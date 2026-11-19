import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { Faq } from "@/components/faq";
import { connection } from "next/server";
import { Suspense } from "react";
import { COMPANY, type Company } from "@/lib/company";
import { getCompany } from "@/lib/data";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { FacebookIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez HOPE Services à Antananarivo : collecte de déchets, entreprises, boutique, partenariats.",
};

// Seuls les canaux renseignés (paramètres de l'admin ou valeurs par défaut) sont affichés.
function channelsOf(company: Company) {
  return [
    company.whatsapp && { Icon: MessageCircle, label: "WhatsApp", value: "Écrivez-nous", href: `https://wa.me/${company.whatsapp}` },
    company.phone && { Icon: Phone, label: "Téléphone", value: company.phone, href: `tel:${company.phone.replace(/\s/g, "")}` },
    company.email && { Icon: Mail, label: "E-mail", value: company.email, href: `mailto:${company.email}` },
    { Icon: FacebookIcon, label: "Facebook", value: company.name, href: company.facebook },
  ].filter(Boolean) as { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];
}

const FAQ = [
  { q: "Je veux faire collecter mes déchets, dois-je vous écrire ?", a: <>Pas besoin : faites directement une <Link href="/collecte/declarer" className="text-brand underline">demande d&apos;enlèvement</Link> en ligne, vous suivrez son avancement depuis votre compte.</> },
  { q: "Vous travaillez avec les entreprises ?", a: "Oui. Décrivez-nous vos volumes et la fréquence souhaitée dans le formulaire (sujet « Collecte pour mon entreprise ») : nous vous proposons un passage régulier." },
  { q: "Je cherche un produit précis ou une commande en quantité", a: "Choisissez le sujet « Une commande, un produit » et précisez le produit et la quantité souhaitée." },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-20">
      <section className="flex flex-col items-center gap-5 text-center">
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Contact</span>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-6xl">Parlons de vos déchets</h1>
        <p className="max-w-xl text-lg text-black/70">
          Une collecte, un partenariat, une question sur un produit ? L&apos;équipe HOPE Services vous répond.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Suspense fallback={<Channels company={COMPANY} />}>
          <ChannelsWithSettings />
        </Suspense>

        <ContactForm />
      </section>

      <section className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Avant de nous écrire</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}

async function ChannelsWithSettings() {
  await connection();
  return <Channels company={await getCompany()} />;
}

function Channels({ company }: { company: Company }) {
  return (
        <div className="flex flex-col gap-4">
          {channelsOf(company).map((c) => (
            <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-4 rounded-3xl bg-surface p-5 transition hover:-translate-y-0.5">
              <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-light text-brand"><c.Icon className="h-5 w-5" /></span>
              <span className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/50">{c.label}</span>
                <span className="font-semibold group-hover:text-brand">{c.value}</span>
              </span>
            </a>
          ))}

          <div className="flex flex-col gap-3 rounded-3xl bg-foreground p-6 text-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Où nous trouver</span>
            <p className="text-xl font-bold">{company.address ?? company.city}</p>
            {company.openingHours && <p className="text-white/70">{company.openingHours}</p>}
            <Link href="/collecte/points" className="mt-2 w-fit rounded-full bg-accent px-4 py-2 text-sm font-semibold text-foreground">
              Voir les points d&apos;apport →
            </Link>
          </div>
        </div>
  );
}
