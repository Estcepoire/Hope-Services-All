import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { PickupForm } from "@/components/pickup-form";
import { getMaterials } from "@/lib/data";

export const metadata: Metadata = { title: "Demander un enlèvement" };

export default function DeclarePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Demander un enlèvement</h1>
        <p className="mt-2 max-w-2xl text-black/70">
          Particuliers et entreprises : décrivez vos déchets, indiquez le lieu, nous venons les chercher.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-brand-light" />}>
        <FormOrLogin />
      </Suspense>
    </div>
  );
}

async function FormOrLogin() {
  await connection();
  const session = await auth();
  if (!session?.user || session.error) {
    return (
      <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-black/10 p-6">
        <p>Connectez-vous pour demander un enlèvement et suivre vos collectes et vos paiements.</p>
        <Link
          href="/connexion?callbackUrl=%2Fcollecte%2Fdeclarer"
          className="w-fit rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Se connecter / Créer un compte
        </Link>
      </div>
    );
  }
  const materials = await getMaterials();
  return <PickupForm materials={materials} />;
}
