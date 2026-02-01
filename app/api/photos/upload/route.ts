import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folder = formData.get("folder") as string;

    if (!files || files.length === 0 || !folder) {
      return NextResponse.json(
        { success: false, message: "Fichiers ou dossier manquants" },
        { status: 400 }
      );
    }

    // Ensure we're only running on localhost for safety
    const host = request.headers.get("host") || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 403 }
      );
    }

    const photosDir = join(process.cwd(), "public", "photos", folder);

    // Create directory if it doesn't exist
    if (!existsSync(photosDir)) {
      await mkdir(photosDir, { recursive: true });
    }

    const uploadedPhotos = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const baseFilename = file.name.replace(/\.[^/.]+$/, "");
        const webpFilename = `${baseFilename}.webp`;
        const webpFilepath = join(photosDir, webpFilename);

        // Compress and convert to WebP
        await sharp(buffer)
          .resize(2000, 2000, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toFile(webpFilepath);

        uploadedPhotos.push({
          src: `/photos/${folder}/${webpFilename}`,
          title: baseFilename,
          description: "",
        });

        console.log(`✅ Photo compressée: ${webpFilename}`);
      } catch (fileError) {
        console.error(`❌ Erreur traitement ${file.name}:`, fileError);
        // Continue with next file instead of failing
      }
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune photo n'a pu être traitée" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) importée(s) et compressée(s)`,
      photos: uploadedPhotos,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
