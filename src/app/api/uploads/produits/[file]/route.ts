import { readProductImage } from "@/lib/uploads";

// Images des produits : publiques (boutique), mises en cache longtemps car leur nom ne change jamais.
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/produits/[file]">) {
  const { file } = await ctx.params;
  const image = await readProductImage(file);
  if (!image) return new Response("Introuvable", { status: 404 });
  return new Response(image.body, {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
