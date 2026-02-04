import { networks } from "@/content/networks";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts: Record<string, number> = {};
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    // Compter depuis la DB via le backend API
    for (const net of networks) {
      try {
        const response = await fetch(`${backendUrl}/api/photos/${net.slug}`, {
          cache: "no-store"
        });
        
        if (response.ok) {
          const data = await response.json();
          const photoCount = Array.isArray(data.photos) ? data.photos.length : 0;
          counts[net.slug] = photoCount;
        } else {
          counts[net.slug] = 0;
        }
      } catch (error) {
        console.error(`Error fetching count for ${net.slug}:`, error);
        counts[net.slug] = 0;
      }
    }

    return Response.json({ counts });
  } catch (error) {
    console.error("Error fetching photo counts:", error);
    return Response.json({ counts: {} }, { status: 500 });
  }
}
