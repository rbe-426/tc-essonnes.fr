import { networks } from "@/content/networks";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const counts: Record<string, number> = {};
    const projectRoot = process.cwd();

    for (const net of networks) {
      const folder = net.folder || net.slug;
      const photosDir = path.join(projectRoot, "public", "photos", folder);
      
      try {
        if (fs.existsSync(photosDir)) {
          const files = fs.readdirSync(photosDir);
          // Compter les fichiers image (pas photos.json ni meta.json)
          const photoCount = files.filter(f => 
            /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
          ).length;
          counts[net.slug] = photoCount;
        } else {
          counts[net.slug] = 0;
        }
      } catch (error) {
        console.error(`Error reading folder for ${folder}:`, error);
        counts[net.slug] = 0;
      }
    }

    return Response.json({ counts });
  } catch (error) {
    console.error("Error fetching photo counts:", error);
    return Response.json({ counts: {} }, { status: 500 });
  }
}
