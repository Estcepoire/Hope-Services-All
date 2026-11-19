import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PointForm } from "@/components/admin/point-form";
import { Card, PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default function EditPointPage(props: PageProps<"/admin/points/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-white" />}>
      <Edit {...props} />
    </Suspense>
  );
}

async function Edit({ params }: PageProps<"/admin/points/[id]">) {
  const { id } = await params;
  await requireRole(["admin"], `/admin/points/${id}`);
  const [point, materials] = await Promise.all([
    prisma.collectionPoint.findUnique({ where: { id }, include: { acceptedMaterials: { select: { id: true } } } }),
    prisma.material.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!point) notFound();
  return (
    <>
      <PageTitle title={point.name} crumbs={["Points d'apport", "Modifier"]} />
      <Card>
        <PointForm point={point} materials={materials} />
      </Card>
    </>
  );
}
