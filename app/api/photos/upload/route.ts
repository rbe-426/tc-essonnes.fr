import { NextRequest, NextResponse } from "next/server";

/**
 * Simple proxy to backend server
 * The actual upload is handled by the Node.js backend
 * This prevents Next.js from trying to compile TypeORM decorators
 */
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get("host") || "";
    
    // Only allow from localhost during development
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string)?.toLowerCase();
    const networkSlug = (formData.get("networkSlug") as string)?.toLowerCase() || folder;
    const authHeader = request.headers.get("authorization");

    if (!files || files.length === 0 || !folder) {
      return NextResponse.json(
        { success: false, message: "Fichiers ou dossier manquants" },
        { status: 400 }
      );
    }

    // En production, le token est requis
    if (!host.includes("localhost") && !host.includes("127.0.0.1") && !authHeader) {
      return NextResponse.json(
        { success: false, message: "Token manquant" },
        { status: 401 }
      );
    }

    // Forward to backend server
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
    
    const backendFormData = new FormData();
    for (const file of files) {
      backendFormData.append("files", file);
    }
    backendFormData.append("folder", folder);
    backendFormData.append("networkSlug", networkSlug);

    const fetchOptions: any = {
      method: "POST",
      body: backendFormData,
    };

    // Ajouter le header Authorization si présent
    if (authHeader) {
      fetchOptions.headers = {
        "Authorization": authHeader,
      };
    }

    const response = await fetch(`${BACKEND_URL}/api/photos/upload`, fetchOptions);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
