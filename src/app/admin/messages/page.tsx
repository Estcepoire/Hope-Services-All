import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const TOPIC_LABELS = {
  PARTICULIER: "Particulier",
  ENTREPRISE: "Entreprise",
  BOUTIQUE: "Boutique",
  PARTENARIAT: "Partenariat",
  AUTRE: "Autre",
} as const;

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Messages du formulaire de contact</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <Messages />
      </Suspense>
    </div>
  );
}

async function markHandled(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/messages");
  await prisma.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { handled: true } });
  revalidatePath("/admin/messages");
}

async function Messages() {
  await requireRole(["admin"], "/admin/messages");
  const messages = await prisma.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });
  if (messages.length === 0) return <p className="text-black/60">Aucun message pour le moment.</p>;

  return (
    <ul className="flex max-w-3xl flex-col gap-3">
      {messages.map((m) => (
        <li key={m.id} className={`rounded-xl border border-black/10 bg-surface p-4 ${m.handled ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              <strong>{m.name}</strong>
              {m.company ? ` · ${m.company}` : ""} · {m.contact}
            </p>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">{TOPIC_LABELS[m.topic]}</span>
          </div>
          <p className="mt-2 whitespace-pre-line">{m.message}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-black/50">
            {m.createdAt.toLocaleString("fr-FR")}
            {m.handled ? (
              <span>Traité</span>
            ) : (
              <form action={markHandled}>
                <input type="hidden" name="id" value={m.id} />
                <button className="rounded-full border border-black/15 px-3 py-1 font-medium text-black hover:border-brand">Marquer comme traité</button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
