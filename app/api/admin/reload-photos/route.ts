import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint pour forcer le rechargement des photos depuis le backend
 * Utile après avoir supprimé des photos ou importé une migration
 */
export async function POST(request: Request) {
  try {
    // Vérifier qu'il y a un token d'authentification (simple)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN || "admin"}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backendUrl}/api/photos/latest?limit=100`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      message: "Cache rechargé depuis le backend",
      count: data.items?.length || 0
    });
  } catch (error) {
    console.error("Error reloading cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reload cache" },
      { status: 500 }
    );
  }
}
