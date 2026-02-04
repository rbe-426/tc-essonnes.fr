import { readdirSync } from "fs";
import { join } from "path";
import { networks } from "@/content/networks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const photosDir = join(process.cwd(), "public/photos");
    
    // Compter le nombre total de photos
    let totalPhotos = 0;
    const networkFolders = new Set<string>();
    
    networks.forEach(net => {
      const folder = net.folder || net.slug;
      networkFolders.add(folder);
    });

    for (const folder of networkFolders) {
      try {
        const folderPath = join(photosDir, folder);
        const files = readdirSync(folderPath);
        // Compter les fichiers image (exclure meta.json et photos.json)
        const imageFiles = files.filter(f => 
          /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
        );
        totalPhotos += imageFiles.length;
      } catch (error) {
        // Dossier inexistant, passer
      }
    }

    return Response.json({
      totalPhotos,
      totalNetworks: networks.length,
      yearsActive: new Date().getFullYear() - 2019, // Depuis 2019
    });
  } catch (error) {
    console.error("Failed to calculate stats:", error);
    return Response.json({
      totalPhotos: 0,
      totalNetworks: networks.length,
      yearsActive: 0,
    }, { status: 500 });
  }
}
