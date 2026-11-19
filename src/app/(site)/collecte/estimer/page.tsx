import type { Metadata } from "next";
import { Estimator } from "@/components/estimator";
import { getMaterials } from "@/lib/data";

export const metadata: Metadata = { title: "Estimer la valeur de mes déchets" };

export default async function EstimatePage() {
  const materials = await getMaterials();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Combien valent vos déchets ?</h1>
        <p className="mt-2 max-w-2xl text-black/70">
          Estimation indicative. Le montant final est fixé après pesée par notre collecteur.
        </p>
      </div>
      <Estimator materials={materials} />
    </div>
  );
}
