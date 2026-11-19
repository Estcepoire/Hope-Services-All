import type { Metadata } from "next";
import { Suspense } from "react";
import { signIn } from "@/auth";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl border border-black/10 p-8">
      <div>
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-2 text-black/70">
          Connectez-vous pour suivre vos collectes, vos gains et vos commandes. Pas encore de compte ? Vous
          pourrez en créer un sur la page suivante.
        </p>
      </div>
      <Suspense>
        <LoginButton searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginButton({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { callbackUrl } = await searchParams;
  // N'accepter que des chemins internes, pour ne pas rediriger vers un site tiers après connexion.
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/compte";

  return (
    <form
      action={async () => {
        "use server";
        await signIn("keycloak", { redirectTo: target });
      }}
    >
      <button className="w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
        Se connecter / Créer un compte
      </button>
    </form>
  );
}
