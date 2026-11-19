import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Demander un enlèvement" };

export default function DeclarePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-bold">Demander un enlèvement</h1>
      {/*
        TODO (nécessite les comptes utilisateurs) :
        - formulaire : matériaux + kg + qualité, photos, position GPS (navigator.geolocation ou clic sur la carte)
        - server action → WasteDeclaration (mode ENLEVEMENT) avec estimatedValue calculé via estimate()
          et distance depuis DEPOT (src/lib/geo.ts)
        - choix du mode de paiement (MVola, Orange Money, Airtel Money, espèces, crédit boutique)
      */}
      <p className="text-black/70">
        Le formulaire de demande arrive bientôt. En attendant, vous pouvez{" "}
        <Link href="/collecte/estimer" className="text-brand underline">estimer la valeur de vos déchets</Link>{" "}
        ou nous contacter.
      </p>
    </div>
  );
}
