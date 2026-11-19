import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth, type AppRole } from "@/auth";

/**
 * Exige une session valide ayant l'un des rôles donnés.
 * À appeler dans chaque page ou server action protégée : le proxy ne fait qu'un tri rapide.
 */
export async function requireRole(roles: AppRole[], callbackUrl: string) {
  await connection(); // auth() utilise crypto avant de lire les cookies : forcer le rendu à la requête
  const session = await auth();
  if (!session?.user || session.error) {
    redirect(`/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (!session.user.roles.some((r) => roles.includes(r))) redirect("/acces-refuse");
  return session;
}
