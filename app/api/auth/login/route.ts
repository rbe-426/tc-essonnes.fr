import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ID = "w.belaidi";
const VALID_PASSWORD = "Waiyl9134#";

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (id === VALID_ID && password === VALID_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: "Connecté avec succès",
        token: "edit-mode-active", // Simple token for now
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Identifiants invalides" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
