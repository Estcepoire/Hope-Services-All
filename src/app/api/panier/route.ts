import { getProducts } from "@/lib/data";

// Prix et stock à jour des produits du panier (le navigateur ne garde que slug + quantité).
// GET /api/panier?slugs=a,b,c
export async function GET(req: Request) {
  const slugs = new Set(
    (new URL(req.url).searchParams.get("slugs") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50),
  );
  const products = (await getProducts())
    .filter((p) => slugs.has(p.slug))
    .map(({ slug, name, price, stock, category, images, recycledKg }) => ({ slug, name, price, stock, category, image: images[0] ?? null, recycledKg }));

  return Response.json(products, { headers: { "Cache-Control": "no-store" } });
}
