import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  
  // Token simple - changez-le par quelque chose de plus sécurisé
  const ADMIN_UNLOCK_TOKEN = process.env.ADMIN_UNLOCK_TOKEN || "unlock-photos-2026";
  
  if (token !== ADMIN_UNLOCK_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  
  // Créer une réponse qui set un cookie
  const response = NextResponse.redirect("/", { status: 301 });
  response.cookies.set("admin-edit-mode", "true", { 
    httpOnly: false,
    path: "/",
    maxAge: 3600 // 1 heure
  });
  
  return response;
}
