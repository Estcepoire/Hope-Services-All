import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { Card, PageTitle } from "@/components/admin/ui";
import { requireRole } from "@/lib/session";

export default function NewProductPage() {
  return (
    <>
      <PageTitle title="Nouveau produit" crumbs={["Produits", "Nouveau"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Form />
        </Suspense>
      </Card>
    </>
  );
}

async function Form() {
  await requireRole(["admin"], "/admin/produits/nouveau");
  return <ProductForm />;
}
