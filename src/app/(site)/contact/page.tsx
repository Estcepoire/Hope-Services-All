import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { Faq } from "@/components/faq";
import { COMPANY } from "@/lib/company";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { FacebookIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez HOPE Services à Antananarivo : collecte de déchets, entreprises, boutique, partenariats.",
};

// Seuls les canaux renseignés dans src/lib/company.ts sont affichés.
const channels = [
  COMPANY.whatsapp && { Icon: MessageCircle, label: "WhatsApp", value: "Écrivez-nous", href: `https://wa.me/${COMPANY.whatsapp}` },
  COMPANY.phone && { Icon: Phone, label: "Téléphone", value: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, "")}` },
  COMPANY.email && { Icon: Mail, label: "E-mail", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { Icon: FacebookIcon, label: "Facebook", value: "HOPE Services", href: COMPANY.facebook },
].filter(Boolean) as { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];

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
        <div className="flex flex-col gap-4">
          {channels.map((c) => (
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
            <p className="text-xl font-bold">{COMPANY.address ?? COMPANY.city}</p>
            {COMPANY.openingHours && <p className="text-white/70">{COMPANY.openingHours}</p>}
            <Link href="/collecte/points" className="mt-2 w-fit rounded-full bg-accent px-4 py-2 text-sm font-semibold text-foreground">
              Voir les points d&apos;apport →
            </Link>
          </div>
        </div>

        <ContactForm />
      </section>

      <section className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Avant de nous écrire</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}
