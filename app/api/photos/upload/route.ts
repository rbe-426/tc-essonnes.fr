import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";
import { AppDataSource } from "@/server/src/database";
import { Photo } from "@/server/src/entities/Photo";
import { Network } from "@/server/src/entities/Network";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string).toLowerCase();
    const networkSlug = (formData.get("networkSlug") as string)?.toLowerCase() || folder;

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

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const photoRepository = AppDataSource.getRepository(Photo);
    const networkRepository = AppDataSource.getRepository(Network);

    // Find the network
    const network = await networkRepository.findOne({ where: { slug: networkSlug } });
    if (!network) {
      return NextResponse.json(
        { success: false, message: `Réseau '${networkSlug}' non trouvé` },
        { status: 404 }
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
        const fullPath = `/photos/${folder}/${webpFilename}`;

        // Compress and convert to WebP
        await sharp(buffer)
          .resize(2000, 2000, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toFile(webpFilepath);

        // Check if photo already exists
        const existing = await photoRepository.findOne({
          where: { src: fullPath },
        });

        if (existing) {
          console.log(`⊘ Photo existe déjà: ${fullPath}`);
          continue;
        }

        // Get the last photo order
        const lastPhoto = await photoRepository.findOne({
          where: { networkId: network.id },
          order: { order: "DESC" },
        });

        // Create and save photo to database
        const photo = photoRepository.create({
          title: baseFilename,
          displayTitle: baseFilename,
          img: webpFilename,
          src: fullPath,
          slug: folder,
          desc: null,
          displayDesc: null,
          brand: null,
          model: null,
          date: null,
          network,
          networkId: network.id,
          order: (lastPhoto?.order ?? -1) + 1,
        });

        await photoRepository.save(photo);

        uploadedPhotos.push({
          id: photo.id,
          src: fullPath,
          title: baseFilename,
          description: "",
        });

        console.log(`✅ Photo importée en DB: ${fullPath}`);
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
      message: `${uploadedPhotos.length} photo(s) importée(s) et sauvegardée(s) en DB`,
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
