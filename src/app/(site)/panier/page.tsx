import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { CartView } from "@/components/cart-view";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-sans text-4xl font-light tracking-tight sm:text-5xl">Panier</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface" />}>
        <CartWithAccount />
      </Suspense>
    </div>
  );
}

async function CartWithAccount() {
  await connection();
  const session = await auth();
  const user =
    session?.user && !session.error
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, creditBalance: true } })
      : null;
  return <CartView account={user} />;
}
