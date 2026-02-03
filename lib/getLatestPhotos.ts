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
function readPhotosJson(dir: string) {
  const p = path.join(dir, "photos.json");
  if (!fs.existsSync(p)) return {} as Record<string,{title?:string;description?:string}>;
  try {
    const raw = JSON.parse(fs.readFileSync(p,"utf8"));
    const arr: any[] = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
    const map: Record<string,{title?:string;description?:string}> = {};
    for (const it of arr) {
      if (typeof it === "string") map[it] = {};
      else if (it && typeof it.src === "string") map[it.src] = { title: it.title, description: it.description };
    }
    return map;
  } catch { return {}; }
}

export function getLatestPhotos(limit = 20): LatestItem[] {
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
      items.push({
        href: n.href || `/gallery/network/${folder}`,
        slug: folder,
        src: path.posix.join("/photos", folder, name),
        title: meta[name]?.title ?? null,
        description: meta[name]?.description ?? null,
        brand: meta[name]?.brand ?? null,
        model: meta[name]?.model ?? null,
        mtime: stat.mtime.getTime(),
      });
    }
  }
  items.sort((a,b)=>b.mtime-a.mtime);
  return items.slice(0, limit);
}

export type { LatestItem };
