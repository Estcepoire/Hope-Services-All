import { STATUS_LABELS } from "@/lib/labels";
import { Check } from "lucide-react";

type Status = keyof typeof STATUS_LABELS;

const STEPS: { status: Status; title: string; hint: string }[] = [
  { status: "EN_ATTENTE", title: "Demande reçue", hint: "Nous vous appelons pour fixer le passage." },
  { status: "PLANIFIEE", title: "Enlèvement planifié", hint: "Un collecteur passera au créneau convenu." },
  { status: "COLLECTEE", title: "Collecté et pesé", hint: "Le montant final est calculé sur la pesée réelle." },
  { status: "PAYEE", title: "Payé", hint: "Le paiement a été envoyé." },
];

/** Suivi par étapes, inspiré de Delivery (Dribbble). */
export function StatusTimeline({ status, dates }: { status: Status; dates: Partial<Record<Status, Date | null>> }) {
  if (status === "ANNULEE") {
    return <p className="rounded-2xl bg-black/5 p-4 font-medium text-black/60">Cette demande a été annulée.</p>;
  }
  const current = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="flex flex-col">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const date = dates[step.status];
        return (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STEPS.length - 1 && (
              <span aria-hidden className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${done ? "bg-brand" : "bg-black/10"}`} />
            )}
            <span
              aria-hidden
              className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                done ? "bg-brand text-white" : active ? "bg-accent text-foreground ring-4 ring-accent/25" : "bg-black/10 text-black/40"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="flex flex-col pt-1">
              <span className={`font-semibold ${!done && !active ? "text-black/40" : ""}`}>
                {step.title}
                {active && <span className="sr-only"> (étape en cours)</span>}
              </span>
              {date && <span className="text-xs text-black/50">{date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>}
              {active && <span className="text-sm text-black/60">{step.hint}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
