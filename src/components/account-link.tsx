import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";

export function LoginLink() {
  return (
    <Link href="/connexion" className="hover:text-brand">
      Connexion
    </Link>
  );
}

/** Lit la session (cookies) : à placer dans un <Suspense> pour garder le reste de la page statique. */
export async function AccountLink() {
  await connection(); // auth() utilise crypto avant de lire les cookies : forcer le rendu à la requête
  const session = await auth();
  if (!session?.user || session.error) return <LoginLink />;
  return (
    <Link href="/compte" className="hover:text-brand">
      Mon compte
    </Link>
  );
}
