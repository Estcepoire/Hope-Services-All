import { Suspense } from "react";
import { PointForm } from "@/components/admin/point-form";
import { Card, PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default function NewPointPage() {
  return (
    <>
      <PageTitle title="Nouveau point d'apport" crumbs={["Points d'apport", "Nouveau"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Form />
        </Suspense>
      </Card>
    </>
  );
}

async function Form() {
  await requireRole(["admin"], "/admin/points/nouveau");
  const materials = await prisma.material.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <PointForm materials={materials} />;
}
