import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Tri rapide avant la page : sans session, on envoie vers la connexion.
// Le contrôle des rôles se fait dans les pages via requireRole() (src/lib/session.ts).
export const proxy = auth((req) => {
  if (!req.auth || req.auth.error) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/collecteur/:path*", "/compte/:path*"],
};
