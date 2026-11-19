import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { logout } from "@/lib/actions/auth";
import { formatAriary } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

const ROLE_LABELS = { particulier: "Particulier", entreprise: "Entreprise", collecteur: "Collecteur", admin: "Administrateur" };

export default function AccountPage() {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const session = await requireRole([...APP_ROLES], "/compte");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, creditBalance: true, _count: { select: { declarations: true, orders: true } } },
  });
  const roles = session.user.roles;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bonjour {user?.name}</h1>
          <p className="text-black/70">{user?.email} · {roles.map((r) => ROLE_LABELS[r]).join(", ")}</p>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-black/15 px-4 py-2 text-sm hover:border-red-600 hover:text-red-600">
            Se déconnecter
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Crédits boutique" value={formatAriary(user?.creditBalance ?? 0)} />
        <Tile label="Collectes" value={String(user?._count.declarations ?? 0)} />
        <Tile label="Commandes" value={String(user?._count.orders ?? 0)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/collecte/declarer" className="rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark">Demander un enlèvement</Link>
        <Link href="/compte/collectes" className="rounded-full border border-brand px-4 py-2 text-brand">Mes collectes</Link>
        <Link href="/compte/commandes" className="rounded-full border border-brand px-4 py-2 text-brand">Mes commandes</Link>
        {roles.includes("collecteur") || roles.includes("admin") ? (
          <Link href="/collecteur" className="rounded-full border border-brand px-4 py-2 text-brand">Espace collecteur</Link>
        ) : null}
        {roles.includes("admin") ? (
          <Link href="/admin" className="rounded-full border border-brand px-4 py-2 text-brand">Administration</Link>
        ) : null}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-light p-5">
      <p className="text-sm text-black/60">{label}</p>
      <p className="text-2xl font-bold text-brand">{value}</p>
    </div>
  );
}
