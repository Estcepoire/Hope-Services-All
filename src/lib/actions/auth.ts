"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { signOut } from "@/auth";

/** Déconnexion du site ET de Keycloak (sinon Keycloak reconnecte aussitôt l'utilisateur). */
export async function logout() {
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: appUrl.startsWith("https://"),
  });

  await signOut({ redirect: false });

  const url = new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`);
  url.searchParams.set("post_logout_redirect_uri", appUrl);
  url.searchParams.set("client_id", process.env.AUTH_KEYCLOAK_ID!);
  if (token?.idToken) url.searchParams.set("id_token_hint", token.idToken);
  redirect(url.toString());
}
