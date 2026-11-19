import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readDeclarationPhoto } from "@/lib/uploads";

// Photos privées : visibles par le déclarant, les collecteurs et les admins uniquement.
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/declarations/[id]/[file]">) {
  const { id, file } = await ctx.params;
  const session = await auth();
  if (!session?.user || session.error) return new Response("Non connecté", { status: 401 });

  const isStaff = session.user.roles.some((r) => r === "admin" || r === "collecteur");
  if (!isStaff) {
    const owner = await prisma.wasteDeclaration.findUnique({ where: { id }, select: { declarantId: true } });
    if (owner?.declarantId !== session.user.id) return new Response("Introuvable", { status: 404 });
  }

  const photo = await readDeclarationPhoto(id, file);
  if (!photo) return new Response("Introuvable", { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.type,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
