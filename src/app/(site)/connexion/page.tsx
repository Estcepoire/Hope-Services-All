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
    <div className="flex flex-col gap-3">
      {process.env.AUTH_GOOGLE_ENABLED === "true" && (
        <form
          action={async () => {
            "use server";
            // kc_idp_hint : Keycloak saute sa page et envoie directement chez Google.
            await signIn("keycloak", { redirectTo: target }, { kc_idp_hint: "google" });
          }}
        >
          <button className="flex w-full items-center justify-center gap-3 rounded-full border border-black/15 px-5 py-3 font-medium hover:bg-black/5">
            <GoogleIcon />
            Continuer avec Google
          </button>
        </form>
      )}
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
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
