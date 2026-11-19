import { CircleAlert, CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card, PageTitle, Table } from "@/components/admin/ui";
import { cancelPickup, markPaid, planPickup, recordWeighing } from "@/lib/actions/admin/collectes";
import { QUALITY_LABELS } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";
import { PAYOUT_LABELS, SLOT_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const input = "h-10 rounded border border-[#dfe7dc] bg-white px-3 text-sm focus:border-brand focus:outline-none";
const primary = "h-10 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark";

export default function DeclarationAdminPage(props: PageProps<"/admin/collectes/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-white" />}>
      <Details {...props} />
    </Suspense>
  );
}

/** Date au format attendu par <input type="datetime-local"> (heure locale du serveur). */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function Details({ params, searchParams }: PageProps<"/admin/collectes/[id]">) {
  const { id } = await params;
  const { erreur, ok } = await searchParams;
  await requireRole(["admin"], `/admin/collectes/${id}`);

  const [d, collectors] = await Promise.all([
    prisma.wasteDeclaration.findUnique({
      where: { id },
      include: {
        declarant: { select: { name: true, email: true, creditBalance: true } },
        collector: { select: { name: true } },
        collectionPoint: { select: { name: true, address: true } },
        items: { include: { material: { select: { name: true, pricePerKg: true } } } },
      },
    }),
    prisma.user.findMany({ where: { role: { in: ["COLLECTEUR", "ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!d) notFound();

  const n = d.id.slice(-6).toUpperCase();
  const canPlan = d.status === "EN_ATTENTE" || d.status === "PLANIFIEE";
  const defaultDate = d.scheduledAt ?? (d.preferredDate ? new Date(`${d.preferredDate.toISOString().slice(0, 10)}T${d.preferredSlot === "APRES_MIDI" ? "14" : "09"}:00:00`) : new Date());

  return (
    <>
      <PageTitle title={`Collecte #${n}`} crumbs={["Collectes", `#${n}`]} />

      {typeof erreur === "string" && (
        <p role="alert" className="mb-4 flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {erreur}</p>
      )}
      {ok && !erreur && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded bg-brand-light p-3 text-sm text-brand-dark"><CircleCheck className="h-4 w-4" /> Modification enregistrée.</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Card title="Déchets" subtitle={d.status === "EN_ATTENTE" || d.status === "PLANIFIEE" ? "pesée à saisir" : "pesés"}>
            <form action={recordWeighing}>
              <input type="hidden" name="id" value={d.id} />
              <Table head={["Matériau", "Qualité", "Prix/kg", "Estimé", "Pesé (kg)"]}>
                {d.items.map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium">{i.material.name}</td>
                    <td>{QUALITY_LABELS[i.quality]}</td>
                    <td>{formatAriary(i.material.pricePerKg)}</td>
                    <td>{i.estimatedKg} kg</td>
                    <td className="text-right">
                      {canPlan ? (
                        <input name={`kg-${i.id}`} type="number" step="0.1" min="0" max="10000" required defaultValue={i.actualKg ?? i.estimatedKg} aria-label={`Poids pesé, ${i.material.name}`} className={`${input} w-28 text-right`} />
                      ) : (
                        <strong>{i.actualKg ?? "-"} kg</strong>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  Estimation : <strong>{formatAriary(d.estimatedValue)}</strong>
                  {d.finalValue != null && <> · Montant final : <strong className="text-brand">{formatAriary(d.finalValue)}</strong></>}
                </p>
                {canPlan && <button className={primary}>Enregistrer la pesée</button>}
              </div>
            </form>
          </Card>

          {d.photoUrls.length > 0 && (
            <Card title="Photos">
              <div className="flex flex-wrap gap-3">
                {d.photoUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- photo privée servie par /api/uploads */}
                    <img src={url} alt={`Photo ${i + 1}`} className="h-32 w-32 rounded object-cover" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Statut">
            <Badge className={STATUS_COLORS[d.status]}>{STATUS_LABELS[d.status]}</Badge>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <Info label="Déclarant">{d.declarant.name}{d.declarant.email ? ` · ${d.declarant.email}` : ""}</Info>
              <Info label={d.mode === "APPORT" ? "Point d'apport" : "Adresse"}>{d.collectionPoint ? `${d.collectionPoint.name}, ${d.collectionPoint.address}` : d.address}</Info>
              {d.lat != null && d.lng != null && (
                <Info label="Position">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer" className="text-brand underline">Itinéraire</a>
                </Info>
              )}
              <Info label="Souhait">
                {d.preferredDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) ?? "-"}
                {d.preferredSlot ? `, ${SLOT_LABELS[d.preferredSlot]}` : ""}
              </Info>
              <Info label="Paiement">{PAYOUT_LABELS[d.payoutMethod]}{d.payoutPhone ? ` · ${d.payoutPhone}` : ""}</Info>
              {d.collector && <Info label="Collecteur">{d.collector.name}</Info>}
              {d.notes && <Info label="Précisions">{d.notes}</Info>}
            </dl>
          </Card>

          {canPlan && (
            <Card title="Planifier le passage">
              <form action={planPickup} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={d.id} />
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Date et heure
                  <input type="datetime-local" name="scheduledAt" required defaultValue={toLocalInput(defaultDate)} className={input} />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Collecteur
                  <select name="collectorId" defaultValue={d.collectorId ?? ""} className={input}>
                    <option value="">Non attribué</option>
                    {collectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <button className={primary}>{d.status === "PLANIFIEE" ? "Modifier le passage" : "Planifier"}</button>
              </form>
            </Card>
          )}

          {d.status === "COLLECTEE" && (
            <Card title="Paiement">
              <p className="mb-3 text-sm">
                {d.payoutMethod === "CREDIT_BOUTIQUE"
                  ? `${formatAriary(d.finalValue ?? 0)} seront ajoutés aux crédits boutique du déclarant.`
                  : `Envoyer ${formatAriary(d.finalValue ?? 0)} par ${PAYOUT_LABELS[d.payoutMethod]}${d.payoutPhone ? ` au ${d.payoutPhone}` : ""}, puis confirmer.`}
              </p>
              <form action={markPaid}>
                <input type="hidden" name="id" value={d.id} />
                <button className={primary}>Marquer comme payée</button>
              </form>
            </Card>
          )}

          {canPlan && (
            <form action={cancelPickup}>
              <input type="hidden" name="id" value={d.id} />
              <ConfirmButton message="Annuler cette demande d'enlèvement ?" className="w-full rounded border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Annuler la demande</ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[#8a978c]">{label}</dt>
      <dd className="font-medium text-brand-dark">{children}</dd>
    </div>
  );
}
