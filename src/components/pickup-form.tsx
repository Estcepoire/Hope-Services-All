"use client";

import { useActionState, useState } from "react";
import { createPickupRequest, type PickupFormState } from "@/lib/actions/pickup";
import { roadKmFromDepot } from "@/lib/distance";
import { estimate } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";
import { LocationPicker, type LatLng } from "./location-picker";
import { newLine, toEstimationLines, WasteLinesEditor, type Material } from "./waste-lines";

const PAYOUT_METHODS = [
  { value: "MVOLA", label: "MVola" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "ESPECES", label: "Espèces, à l'enlèvement" },
  { value: "CREDIT_BOUTIQUE", label: "Crédits sur la boutique" },
];
const MOBILE_MONEY = ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"];
const MAX_PHOTOS = 4;

/** Réduit une photo à 1600 px de côté en JPEG : ~300 Ko au lieu de plusieurs Mo, adapté aux réseaux mobiles. */
async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compression"))), "image/jpeg", 0.8),
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PickupForm({ materials }: { materials: Material[] }) {
  const [state, formAction, pending] = useActionState<PickupFormState, FormData>(createPickupRequest, {});
  const [lines, setLines] = useState(() => [newLine(materials, 5)]);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("MVOLA");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Champs contrôlés : React vide les champs non contrôlés après chaque envoi, même en cas d'erreur.
  const [fields, setFields] = useState({ address: "", preferredDate: "", preferredSlot: "MATIN", payoutPhone: "", notes: "" });
  const bind = (name: keyof typeof fields) => ({
    name,
    value: fields[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [name]: e.target.value })),
  });

  const distanceKm = position ? roadKmFromDepot(position) : 0;
  const result = estimate({ mode: "ENLEVEMENT", distanceKm, lines: toEstimationLines(lines, materials) });
  const err = state.fieldErrors ?? {};

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoError(null);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setPhotoError(`${MAX_PHOTOS} photos maximum.`);
    try {
      const added = await Promise.all(
        [...files].slice(0, room).map(async (f) => {
          const file = await compressPhoto(f);
          return { file, url: URL.createObjectURL(file) };
        }),
      );
      setPhotos((p) => [...p, ...added]);
    } catch {
      setPhotoError("Une photo n'a pas pu être lue. Essayez une autre image.");
    }
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    setPhotos((p) => p.filter((_, j) => j !== i));
  }

  // Les photos compressées et la liste des déchets sont ajoutées au FormData au moment de l'envoi.
  function submit(formData: FormData) {
    formData.set("items", JSON.stringify(lines.map(({ materialId, kg, quality }) => ({ materialId, kg, quality }))));
    photos.forEach((p) => formData.append("photos", p.file));
    return formAction(formData);
  }

  return (
    <form action={submit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-8">
        <Section title="1. Vos déchets" error={err.items}>
          <WasteLinesEditor materials={materials} lines={lines} onChange={setLines} />
        </Section>

        <Section title="2. Lieu d'enlèvement" error={err.lat ?? err.lng}>
          <LocationPicker value={position} onChange={setPosition} />
          <input type="hidden" name="lat" value={position?.lat ?? ""} />
          <input type="hidden" name="lng" value={position?.lng ?? ""} />
          <label className="flex flex-col gap-1 text-sm">
            Adresse ou repère
            <input
              {...bind("address")}
              required
              placeholder="Ex : Lot II M 85 Ankorondrano, portail vert près de l'épicerie"
              className="rounded-lg border border-black/15 p-2"
            />
            <FieldError message={err.address} />
          </label>
        </Section>

        <Section title="3. Date souhaitée">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Jour
              <input type="date" {...bind("preferredDate")} required min={tomorrowIso()} suppressHydrationWarning className="rounded-lg border border-black/15 p-2" />
              <FieldError message={err.preferredDate} />
            </label>
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend>Créneau</legend>
              <div className="flex gap-4 pt-2">
                {(["MATIN", "APRES_MIDI"] as const).map((slot) => (
                  <label key={slot} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="preferredSlot"
                      value={slot}
                      checked={fields.preferredSlot === slot}
                      onChange={() => setFields((f) => ({ ...f, preferredSlot: slot }))}
                    />
                    {slot === "MATIN" ? "Matin (8h–12h)" : "Après-midi (13h–17h)"}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <p className="text-sm text-black/60">Nous vous confirmons le passage par téléphone.</p>
        </Section>

        <Section title="4. Paiement">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Mode de paiement
              <select name="payoutMethod" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="rounded-lg border border-black/15 p-2">
                {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
            {MOBILE_MONEY.includes(payoutMethod) && (
              <label className="flex flex-col gap-1 text-sm">
                Numéro qui recevra le paiement
                <input {...bind("payoutPhone")} type="tel" inputMode="tel" required placeholder="034 12 345 67" className="rounded-lg border border-black/15 p-2" />
                <FieldError message={err.payoutPhone} />
              </label>
            )}
          </div>
        </Section>

        <Section title="5. Photos et précisions (facultatif)" error={err.photos ?? photoError ?? undefined}>
          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="h-24 w-24 rounded-lg object-cover" />
                <button type="button" onClick={() => removePhoto(i)} aria-label="Retirer la photo" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white text-sm shadow">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 text-center text-xs text-black/60 hover:border-brand">
                📷 Ajouter
                <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <textarea {...bind("notes")} rows={3} maxLength={500} placeholder="Accès, étage, quantité exacte, horaires…" className="rounded-lg border border-black/15 p-2 text-sm" />
        </Section>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl bg-brand-light p-6 lg:sticky lg:top-4">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt>Valeur des matériaux</dt><dd>{formatAriary(result.gross)}</dd></div>
          <div className="flex justify-between">
            <dt>Frais d&apos;enlèvement{position ? ` (~${distanceKm} km)` : ""}</dt>
            <dd>{!position ? "Selon le lieu" : result.pickupFee ? `− ${formatAriary(result.pickupFee)}` : "Offerts"}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-lg font-bold text-brand">
            <dt>Estimation</dt><dd>{position ? formatAriary(result.net) : "-"}</dd>
          </div>
        </dl>
        {!position && <p className="text-xs text-black/60">Placez le lieu d&apos;enlèvement pour calculer les frais.</p>}
        {position && result.gross > 0 && result.net === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Pour cette quantité, les frais d&apos;enlèvement dépassent la valeur des déchets. Vous pouvez les
            déposer gratuitement dans un <a href="/collecte/points" className="underline">point d&apos;apport</a>,
            ou ajouter d&apos;autres déchets.
          </p>
        )}
        <p className="text-xs text-black/60">Le montant final est fixé après pesée par notre collecteur.</p>
        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="rounded-full bg-brand px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Envoi…" : "Envoyer ma demande"}
        </button>
      </aside>
    </form>
  );
}

function Section({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      <FieldError message={error} />
    </section>
  );
}

function FieldError({ message }: { message?: string | null }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}
