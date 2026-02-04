import { readdirSync } from "fs";
import { join } from "path";
import { networks } from "@/content/networks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    
    // Compter le nombre total de photos depuis la DB
    let totalPhotos = 0;
    
    for (const net of networks) {
      try {
        const response = await fetch(`${backendUrl}/api/photos/${net.slug}`, {
          cache: "no-store"
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.photos)) {
            totalPhotos += data.photos.length;
          }
        }
      } catch (error) {
        // Continuer si une requête échoue
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
