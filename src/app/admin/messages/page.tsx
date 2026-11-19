import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { FieldFilter, ListToolbar, Pagination, SelectFilter } from "@/components/admin/list-toolbar";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageTitle } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { dateRange, oneOf, pageParams, str } from "@/lib/admin/list-params";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const TOPIC_LABELS = {
  PARTICULIER: "Particulier",
  ENTREPRISE: "Entreprise",
  BOUTIQUE: "Boutique",
  PARTENARIAT: "Partenariat",
  AUTRE: "Autre",
} as const;

export default function MessagesPage(props: PageProps<"/admin/messages">) {
  return (
    <>
      <PageTitle title="Messages" crumbs={["Messages"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Messages {...props} />
        </Suspense>
      </Card>
    </>
  );
}

const TOPICS = Object.keys(TOPIC_LABELS) as (keyof typeof TOPIC_LABELS)[];

async function deleteMessage(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/messages");
  await prisma.contactMessage.deleteMany({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/messages");
}

async function markHandled(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/messages");
  await prisma.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { handled: true } });
  revalidatePath("/admin/messages");
}

async function Messages({ searchParams }: PageProps<"/admin/messages">) {
  await requireRole(["admin"], "/admin/messages");
  const sp = await searchParams;
  const q = str(sp, "q");
  const sujet = oneOf(sp, "sujet", TOPICS);
  const etat = oneOf(sp, "etat", ["a-traiter", "traites"] as const);
  const { page, skip, take } = pageParams(sp);

  const where: Prisma.ContactMessageWhereInput = {
    ...(sujet && { topic: sujet }),
    ...(etat && { handled: etat === "traites" }),
    ...(dateRange(sp) && { createdAt: dateRange(sp) }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { contact: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: [{ handled: "asc" }, { createdAt: "desc" }], skip, take }),
  ]);

  const toolbar = (
    <ListToolbar
      basePath="/admin/messages"
      sp={sp}
      placeholder="Nom, contact, entreprise, texte du message…"
      filters={
        <>
          <SelectFilter name="etat" label="État" value={etat} options={[{ value: "a-traiter", label: "À traiter" }, { value: "traites", label: "Traités" }]} />
          <SelectFilter name="sujet" label="Sujet" value={sujet} options={TOPICS.map((t) => ({ value: t, label: TOPIC_LABELS[t] }))} />
        </>
      }
      advanced={
        <>
          <FieldFilter name="du" label="Reçu du" type="date" value={str(sp, "du")} />
          <FieldFilter name="au" label="Au" type="date" value={str(sp, "au")} />
        </>
      }
    />
  );
  if (messages.length === 0) return <>{toolbar}<p className="py-6 text-center text-[#8a978c]">Aucun message ne correspond.</p></>;

  return (
    <>
    {toolbar}
    <ul className="flex max-w-3xl flex-col gap-3">
      {messages.map((m) => (
        <li key={m.id} className={`rounded-md border border-[#e6ece3] p-4 ${m.handled ? "opacity-60" : ""}`}>
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
            <div className="flex items-center gap-2">
              {m.handled ? (
                <span>Traité</span>
              ) : (
                <form action={markHandled}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="rounded bg-brand px-3 py-1 font-semibold text-white hover:bg-brand-dark">Marquer comme traité</button>
                </form>
              )}
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={m.id} />
                <ConfirmButton message="Supprimer définitivement ce message ?" className="rounded border border-red-200 px-3 py-1 font-semibold text-red-700 hover:bg-red-50">Supprimer</ConfirmButton>
              </form>
            </div>
          </div>
        </li>
      ))}
    </ul>
    <Pagination basePath="/admin/messages" sp={sp} page={page} total={total} />
    </>
  );
}
