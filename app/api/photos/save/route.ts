import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { folder, photos } = await request.json();

    if (!folder || !photos) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const photosPath = join(
      process.cwd(),
      "public",
      "photos",
      folder,
      "photos.json"
    );

    await writeFile(photosPath, JSON.stringify(photos, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "Photos sauvegardées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    if (!folder) {
      return NextResponse.json(
        { success: false, message: "Dossier manquant" },
        { status: 400 }
      );
    }

    const photosPath = join(
      process.cwd(),
      "public",
      "photos",
      folder,
      "photos.json"
    );
    const metaPath = join(
      process.cwd(),
      "public",
      "photos",
      folder,
      "meta.json"
    );

    const photosData = await readFile(photosPath, "utf-8");
    const metaData = await readFile(metaPath, "utf-8");

    return NextResponse.json({
      success: true,
      photos: JSON.parse(photosData),
      meta: JSON.parse(metaData),
    });
  } catch (error) {
    console.error("Erreur lors de la lecture:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
