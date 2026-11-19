// Authentification : Keycloak (OpenID Connect) via Auth.js.
// Les rôles sont gérés dans Keycloak (realm "hope") ; on les lit dans le jeton d'accès
// et on les recopie sur l'utilisateur en base pour les jointures (déclarations, commandes…).
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { decodeJwt } from "jose";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const APP_ROLES = ["particulier", "entreprise", "collecteur", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; roles: AppRole[] };
    error?: "RefreshTokenError";
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    roles?: AppRole[];
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // secondes epoch
    error?: "RefreshTokenError";
  }
}

const issuer = process.env.AUTH_KEYCLOAK_ISSUER!;

function rolesFrom(accessToken: string): AppRole[] {
  const claims = decodeJwt(accessToken) as { realm_access?: { roles?: string[] } };
  const roles = claims.realm_access?.roles ?? [];
  return APP_ROLES.filter((r) => roles.includes(r));
}

/** Rôle principal stocké en base : le plus élevé que l'utilisateur possède. */
function primaryRole(roles: AppRole[]): Role {
  if (roles.includes("admin")) return "ADMIN";
  if (roles.includes("collecteur")) return "COLLECTEUR";
  if (roles.includes("entreprise")) return "ENTREPRISE";
  return "PARTICULIER";
}

async function syncUser(
  sub: string,
  name: string,
  email: string | null | undefined,
  emailVerified: boolean,
  roles: AppRole[],
) {
  const role = primaryRole(roles);
  const existing = await prisma.user.findUnique({ where: { keycloakId: sub }, select: { id: true } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { name, email: email ?? null, role } });
    return existing.id;
  }

  if (email) {
    const sameEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (sameEmail) {
      // Compte Keycloak recréé avec le même e-mail (réinscription, realm réinitialisé) :
      // on rattache l'historique seulement si Keycloak garantit que l'e-mail appartient bien à la personne.
      if (emailVerified) {
        await prisma.user.update({ where: { id: sameEmail.id }, data: { keycloakId: sub, name, role } });
        return sameEmail.id;
      }
      email = null; // e-mail non vérifié : nouveau compte, sans reprendre les données de l'ancien
    }
  }

  const created = await prisma.user.create({
    data: { keycloakId: sub, name, email: email ?? null, role },
    select: { id: true },
  });
  return created.id;
}

async function refresh(refreshToken: string) {
  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.AUTH_KEYCLOAK_ID!,
      client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Keycloak refresh ${res.status}`);
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    id_token?: string;
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak],
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Première connexion : on garde les jetons Keycloak et on synchronise l'utilisateur.
      if (account?.access_token) {
        const roles = rolesFrom(account.access_token);
        const name = profile?.name ?? token.name ?? token.email ?? "Utilisateur";
        return {
          ...token,
          roles,
          // `token.sub` est un identifiant Auth.js aléatoire : l'identifiant Keycloak est providerAccountId.
          userId: await syncUser(account.providerAccountId, name, token.email, profile?.email_verified === true, roles),
          idToken: account.id_token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      if (token.expiresAt && Date.now() < (token.expiresAt - 30) * 1000) return token;
      if (!token.refreshToken) return { ...token, error: "RefreshTokenError" as const };

      // Jeton d'accès expiré : on le renouvelle, ce qui reflète aussi les changements de rôles
      // et coupe la session si le compte a été désactivé dans Keycloak.
      try {
        const t = await refresh(token.refreshToken);
        const roles = rolesFrom(t.access_token);
        if (roles.join() !== token.roles?.join()) {
          await prisma.user.update({ where: { id: token.userId }, data: { role: primaryRole(roles) } });
        }
        return {
          ...token,
          roles,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? token.refreshToken,
          idToken: t.id_token ?? token.idToken,
          expiresAt: Math.floor(Date.now() / 1000) + t.expires_in,
          error: undefined,
        };
      } catch (e) {
        console.error("Renouvellement du jeton Keycloak impossible", e);
        return { ...token, error: "RefreshTokenError" as const };
      }
    },

    session({ session, token }) {
      session.user.id = token.userId!;
      session.user.roles = token.error ? [] : (token.roles ?? []);
      session.error = token.error;
      return session;
    },
  },
});
