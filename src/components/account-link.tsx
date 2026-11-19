import { LogOut } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { logout } from "@/lib/actions/auth";

export function LoginLink() {
  return (
    <Link href="/connexion" className="hover:text-brand">
      Connexion
    </Link>
  );
}

/**
 * Connecté : pastille d'initiales + prénom (vers « Mon compte ») et bouton de déconnexion,
 * comme dans l'espace admin. Lit la session (cookies) : à placer dans un <Suspense>.
 */
export async function AccountLink({ compact = false }: { compact?: boolean }) {
  await connection(); // auth() utilise crypto avant de lire les cookies : forcer le rendu à la requête
  const session = await auth();
  if (!session?.user || session.error) return <LoginLink />;

  const name = session.user.name ?? "Mon compte";
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <span className="flex items-center gap-3">
      <Link href="/compte" title="Mon compte" className="flex items-center gap-2 hover:text-brand">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-white">{initials}</span>
        <span className={compact ? "" : "hidden lg:inline"}>{name.split(/\s+/)[0]}</span>
      </Link>
      <form action={logout}>
        <button aria-label="Se déconnecter" title="Se déconnecter" className="grid h-9 w-9 place-items-center rounded-full text-black/60 hover:bg-black/5 hover:text-red-600">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </form>
    </span>
  );
}
