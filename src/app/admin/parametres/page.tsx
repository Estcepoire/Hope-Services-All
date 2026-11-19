import { CircleAlert, CircleCheck } from "lucide-react";
import { Suspense } from "react";
import { Card, PageTitle } from "@/components/admin/ui";
import { saveSettings } from "@/lib/actions/admin/settings";
import { COMPANY } from "@/lib/company";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const input = "w-full rounded border border-[#dfe7dc] bg-white p-2.5 text-sm focus:border-brand focus:outline-none";

const FIELDS = [
  { name: "description", label: "Description courte (pied de page, À propos)", multiline: true },
  { name: "slogan", label: "Slogan" },
  { name: "address", label: "Adresse" },
  { name: "phone", label: "Téléphone" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "whatsapp", label: "WhatsApp (laisser vide si non utilisé)" },
  { name: "facebook", label: "Page Facebook", type: "url" },
  { name: "openingHours", label: "Horaires (laisser vide pour ne pas les afficher)" },
] as const;

export default function SettingsPage(props: PageProps<"/admin/parametres">) {
  return (
    <>
      <PageTitle title="Paramètres du site" crumbs={["Paramètres"]} />
      <Suspense fallback={<p>Chargement…</p>}>
        <Settings {...props} />
      </Suspense>
    </>
  );
}

async function Settings({ searchParams }: PageProps<"/admin/parametres">) {
  await requireRole(["admin"], "/admin/parametres");
  const { ok, erreur } = await searchParams;
  const s = await prisma.siteSettings.findUnique({ where: { id: "default" } });

  return (
    <Card title="Coordonnées et textes" subtitle="affichés sur le site public">
      {ok && <p role="status" className="mb-4 flex items-center gap-2 rounded bg-brand-light p-3 text-sm text-brand-dark"><CircleCheck className="h-4 w-4" /> Paramètres enregistrés : le site est à jour.</p>}
      {typeof erreur === "string" && <p role="alert" className="mb-4 flex items-center gap-2 rounded bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="h-4 w-4" /> {erreur}</p>}
      <p className="mb-5 text-sm text-[#5b6b5e]">Un champ vide reprend la valeur par défaut, indiquée en gris.</p>
      <form action={saveSettings} className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const value = s?.[f.name] ?? "";
          const placeholder = COMPANY[f.name] ?? "";
          return (
            <label key={f.name} className={`flex flex-col gap-1.5 text-sm ${"multiline" in f ? "sm:col-span-2" : ""}`}>
              <span className="font-semibold text-brand-dark">{f.label}</span>
              {"multiline" in f ? (
                <textarea name={f.name} defaultValue={value} placeholder={placeholder} rows={3} maxLength={300} className={input} />
              ) : (
                <input name={f.name} type={"type" in f ? f.type : "text"} defaultValue={value} placeholder={placeholder} className={input} />
              )}
            </label>
          );
        })}
        <div className="sm:col-span-2">
          <button className="h-10 rounded bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark">Enregistrer</button>
        </div>
      </form>
    </Card>
  );
}
