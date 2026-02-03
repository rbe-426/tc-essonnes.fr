import fs from "fs";
import path from "path";
import { networks } from "../content/networks";

const VALID = new Set([".jpg",".jpeg",".png",".webp",".gif"]);

export type LatestItem = {
  href: string; slug: string; src: string;
  title?: string | null; description?: string | null; brand?: string | null; model?: string | null; mtime: number;
};

// Essayer de lire depuis la DB via l'API, sinon fallback sur les fichiers
async function getFromAPI(limit: number): Promise<LatestItem[] | null> {
  try {
    // En production, utiliser /api/photos/latest
    const res = await fetch(`${process.env.BACKEND_URL || "http://localhost:3001"}/api/photos/latest?limit=${limit}`, {
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || null;
  } catch (error) {
    console.warn("⚠ API photos/latest indisponible, fallback fichiers");
    return null;
  }
}

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

// Fallback: lire depuis les fichiers JSON
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
      items.push({
        href: n.href || `/gallery/network/${folder}`,
        slug: folder,
        src: fullPath,
        title: meta[fullPath]?.title ?? null,
        description: meta[fullPath]?.description ?? null,
        brand: meta[fullPath]?.brand ?? null,
        model: meta[fullPath]?.model ?? null,
        mtime: stat.mtime.getTime(),
      });
    }
  }
  items.sort((a,b)=>b.mtime-a.mtime);
  return items.slice(0, limit);
}

export async function getLatestPhotos(limit = 20): Promise<LatestItem[]> {
  // Essayer l'API d'abord
  const fromAPI = await getFromAPI(limit);
  if (fromAPI) return fromAPI;
  
  // Fallback sur les fichiers
  return getFromFiles(limit);
}
