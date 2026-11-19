import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { Card, PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export default function EditProductPage(props: PageProps<"/admin/produits/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-white" />}>
      <Edit {...props} />
    </Suspense>
  );
}

async function Edit({ params }: PageProps<"/admin/produits/[id]">) {
  const { id } = await params;
  await requireRole(["admin"], `/admin/produits/${id}`);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title={product.name} crumbs={["Produits", "Modifier"]} />
        {product.published && (
          <Link href={`/boutique/${product.slug}`} target="_blank" className="flex items-center gap-1 text-sm text-brand hover:underline">
            Voir dans la boutique <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <Card>
        <ProductForm product={product} />
      </Card>
    </>
  );
}
