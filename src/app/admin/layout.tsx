import { Nunito, Poppins } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";

// Accès réservé au rôle admin : vérifié par requireRole() dans chaque composant qui lit des données
// (un layout ne se ré-exécute pas à chaque navigation, il ne suffit donc pas comme garde).
// Polices de NiceAdmin : Poppins (titres et navigation) et Nunito (texte).

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["500", "600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={`${poppins.variable} ${nunito.variable}`}>
      <Suspense fallback={<div className="min-h-screen bg-[#f5f8f2]" />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  return <AdminShell userName={session?.user?.name ?? "Admin"}>{children}</AdminShell>;
}
