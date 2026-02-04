import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

/**
 * POST /api/admin/import-photos
 * Déclenche l'import des photos depuis les fichiers JSON vers la base de données PostgreSQL
 * 
 * En développement: aucune authentification requise
 * En production: Token requis
 */
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get("host") || "";
    const isDev = host.includes("localhost") || host.includes("127.0.0.1");

    // En production, vérifier le token
    if (!isDev) {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      const adminToken = process.env.ADMIN_TOKEN;

      if (!token || token !== adminToken) {
        return NextResponse.json(
          { success: false, message: "Non autorisé" },
          { status: 401 }
        );
      }
    }

    // Appeler le backend pour exécuter l'import
    const response = await fetch(`${BACKEND_URL}/api/admin/import-photos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Erreur lors de l'import" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Import terminé avec succès",
      ...data,
    });
  } catch (error) {
    console.error("Erreur import photos:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
