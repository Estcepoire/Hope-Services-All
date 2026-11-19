"use client";

import { useActionState, useState } from "react";
import { sendContactMessage, type ContactFormState } from "@/lib/actions/contact";
import { CircleCheck } from "lucide-react";

const TOPICS = [
  { value: "PARTICULIER", label: "Je suis un particulier" },
  { value: "ENTREPRISE", label: "Collecte pour mon entreprise" },
  { value: "BOUTIQUE", label: "Une commande, un produit" },
  { value: "PARTENARIAT", label: "Partenariat, presse, ONG" },
  { value: "AUTRE", label: "Autre chose" },
];

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(sendContactMessage, {});
  // Champs contrôlés : conservés si le serveur renvoie une erreur.
  const [f, setF] = useState({ topic: "PARTICULIER", name: "", contact: "", company: "", message: "" });
  const bind = (name: keyof typeof f) => ({
    name,
    value: f[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((v) => ({ ...v, [name]: e.target.value })),
  });
  const err = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-[2rem] bg-surface p-10 text-center">
        <CircleCheck aria-hidden className="h-14 w-14 text-brand" strokeWidth={1.5} />
        <h2 className="text-2xl font-extrabold">Message bien reçu, merci !</h2>
        <p className="text-black/70">Nous vous répondons au plus vite.</p>
      </div>
    );
  }

  const input = "w-full rounded-xl border border-black/10 bg-background p-3 focus:border-brand focus:outline-none";

  return (
    <form action={action} className="flex flex-col gap-4 rounded-[2rem] bg-surface p-6 sm:p-8">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Votre demande concerne</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label key={t.value} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium ${f.topic === t.value ? "bg-foreground text-white" : "bg-background hover:bg-brand-light"}`}>
              <input type="radio" name="topic" value={t.value} checked={f.topic === t.value} onChange={() => setF((v) => ({ ...v, topic: t.value }))} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={err.name}>
          <input {...bind("name")} required autoComplete="name" className={input} />
        </Field>
        <Field label="Téléphone ou e-mail" error={err.contact}>
          <input {...bind("contact")} required autoComplete="email" placeholder="034 12 345 67" className={input} />
        </Field>
      </div>
      {f.topic === "ENTREPRISE" || f.topic === "PARTENARIAT" ? (
        <Field label="Entreprise ou organisation">
          <input {...bind("company")} autoComplete="organization" className={input} />
        </Field>
      ) : null}
      <Field label="Message" error={err.message}>
        <textarea {...bind("message")} required rows={5} maxLength={2000} placeholder="Types de déchets, quantités, fréquence, question sur un produit…" className={input} />
      </Field>

      {/* Champ piège anti-robots, masqué aux humains et aux lecteurs d'écran */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-fit rounded-full bg-brand px-6 py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {error && <span className="font-normal text-red-600">{error}</span>}
    </label>
  );
}
