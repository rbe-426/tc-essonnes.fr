import fs from "fs";
import path from "path";
import { networks } from "../content/networks";

const VALID = new Set([".jpg",".jpeg",".png",".webp",".gif"]);

export type LatestItem = {
  href: string; slug: string; src: string;
  title?: string | null; description?: string | null; brand?: string | null; model?: string | null; mtime: number;
};

function folderFor(n: any) {
  const fromHref = (n?.href || "").split("/").filter(Boolean).pop();
  return (n as any).folder || fromHref || n.slug;
}

function readPhotosJson(dir: string): Record<string,{title?:string;description?:string;brand?:string;model?:string}> {
  const p = path.join(dir, "photos.json");
  if (!fs.existsSync(p)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(p,"utf8"));
    const arr: any[] = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
    const map: Record<string,{title?:string;description?:string;brand?:string;model?:string}> = {};
    for (const it of arr) {
      if (typeof it === "string") map[it] = {};
      else if (it && typeof it.src === "string") map[it.src] = { title: it.title, description: it.description, brand: it.brand, model: it.model };
    }
    return map;
  } catch { return {}; }
}

// Fallback: lire depuis les fichiers JSON (données obsolètes, à utiliser que si DB est indisponible)
function getFromFiles(limit = 20): LatestItem[] {
  const items: LatestItem[] = [];
  for (const n of networks) {
    const folder = folderFor(n);
    const dir = path.join(process.cwd(), "public", "photos", folder);
    if (!fs.existsSync(dir)) continue;

    const meta = readPhotosJson(dir);
    for (const name of fs.readdirSync(dir)) {
      const ext = path.extname(name).toLowerCase();
      if (!VALID.has(ext)) continue;
      const stat = fs.statSync(path.join(dir, name));
      const fullPath = path.posix.join("/photos", folder, name);
      
      const metaByFullPath = meta[fullPath];
      const metaByName = meta[name];
      const metadata = metaByFullPath || metaByName || {};
      
      items.push({
        href: n.href || `/gallery/network/${folder}`,
        slug: folder,
        src: fullPath,
        title: metadata.title ?? null,
        description: metadata.description ?? null,
        brand: metadata.brand ?? null,
        model: metadata.model ?? null,
        mtime: stat.mtime.getTime(),
      });
    }
  }
  items.sort((a,b)=>b.mtime-a.mtime);
  return items.slice(0, limit);
}

// Fetch depuis l'API (source de vérité PostgreSQL)
async function getFromAPI(limit: number): Promise<LatestItem[] | null> {
  const maxRetries = 3;
  const retryDelay = 500; // ms
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const res = await fetch(`${backendUrl}/api/photos/latest?limit=${limit}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.warn(`⚠ API ${res.status} (attempt ${attempt}/${maxRetries})`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        return null;
      }
      const data = await res.json();
      return data.items || null;
    } catch (error) {
      console.warn(`⚠ API indisponible (attempt ${attempt}/${maxRetries}): ${error}`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  return null;
}

export async function getLatestPhotos(limit = 20): Promise<LatestItem[]> {
  // Architecture 100% database-driven - source de vérité unique = PostgreSQL
  const fromAPI = await getFromAPI(limit);
  if (fromAPI && fromAPI.length > 0) {
    console.log(`✓ ${fromAPI.length} photos depuis API DB`);
    return fromAPI;
  }
  
  // AUCUN fallback - si la DB est indisponible, retourner vide
  console.error("❌ API DB indisponible - aucune photo disponible");
  console.error("   Vérifier: DATABASE_URL sur Railway et que le backend est accessible");
  return [];
}
