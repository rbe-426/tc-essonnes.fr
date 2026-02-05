// app/gallery/network/[slug]/page.tsx
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
// Chemin: [slug]/page.tsx → ../ (network) ../ (gallery) ../ (app) ../ (root) puis content/networks
import { networks } from "../../../../content/networks";
import PhotoGrid from "../../../../components/PhotoGrid";
import NetworkPageClient from "./client";

export const runtime = "nodejs";
const VALID_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
type PhotoItem = { src: string; title?: string; description?: string; id?: string };

const norm = (s: string) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Générer un ID simple pour les photos du fallback filesystem
function generateFallbackId(src: string): string {
  // Utiliser le nom de fichier comme base pour l'ID (pour coherence)
  const filename = src.split("/").pop() || src;
  // Simple hash du filename pour garantir unicité
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return filename + "-" + Math.abs(hash).toString(36);
}

const photosDir = (folder: string) => path.join(process.cwd(), "public", "photos", folder);

function readSidecarJson(filePath: string): Partial<PhotoItem> {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return {}; }
}

// ← NORMALISE n'importe quel src pour ne garder QUE le nom de fichier
function cleanSrc(folder: string, src: string) {
  // Exemple: "/photos/tisse/222023 - GC 2.webp" → "222023 - GC 2.webp"
  const match = src.match(/([^\/]+)$/);
  return match ? match[1] : src;
}

// Récupérer les photos depuis la BD (via l'API du serveur)
async function readPhotosFromDatabase(slug: string): Promise<PhotoItem[]> {
  try {
    // Utiliser l'URL absolue pour les server components en dev/prod
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.VERCEL_URL || process.env.RAILWAY_STATIC_URL || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    const apiUrl = `${baseUrl}/api/photos-backend/${slug}`;
    console.log(`📡 [readPhotosFromDatabase] slug="${slug}", endpoint="${apiUrl}"`);
    
    const response = await fetch(apiUrl, { 
      cache: "no-store" 
    });
    
    console.log(`📊 [readPhotosFromDatabase] Response status: ${response.status}`);
    
    if (!response.ok) {
      console.warn(`❌ [readPhotosFromDatabase] Pas de BD pour ${slug} (status ${response.status})`);
      return [];
    }
    
    const data = await response.json();
    console.log(`✅ [readPhotosFromDatabase] Data reçue:`, data);
    
    if (data.success && Array.isArray(data.photos)) {
      console.log(`📸 [readPhotosFromDatabase] ${data.photos.length} photos trouvées`);
      return data.photos.map((p: any) => {
        console.log(`   - Photo: src=${p.src}, title=${p.displayTitle || p.title}`);
        return {
          src: p.src,
          title: p.displayTitle || p.title,
          description: p.displayDesc || p.desc,
          id: p.id,
        };
      });
    }
    console.warn(`⚠️ [readPhotosFromDatabase] Format inattendu:`, data);
    return [];
  } catch (err) {
    console.error(`❌ [readPhotosFromDatabase] Erreur pour ${slug}:`, err);
    return [];
  }
}

function readPhotosFromFolder(folder: string): PhotoItem[] {
  const dir = photosDir(folder);
  if (!fs.existsSync(dir)) return [];

  const manifest = path.join(dir, "photos.json");
  if (fs.existsSync(manifest)) {
    try {
      const content = fs.readFileSync(manifest, "utf8").replace(/^\uFEFF/, '');
      const raw = JSON.parse(content);
      const arr: any[] = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
      console.log("✅ Photos trouvées:", arr.length);
      return arr
        .map((p) => (typeof p === "string" ? { src: p } : p))
        .filter((p) => typeof p?.src === "string")
        .map((p) => {
          const file = cleanSrc(folder, p.src);
          const src = path.posix.join("/photos", folder, file);
          return {
            src: src,
            title: p.title,
            description: p.description,
            id: generateFallbackId(src),
          };
        });
    } catch (err) {
      /* fallback scan */
    }
  }

  // Scan des fichiers
  const files = fs.readdirSync(dir);
  const images = files.filter((f) => VALID_EXT.includes(path.extname(f).toLowerCase()));
  return images.map((file) => {
    const base = path.basename(file, path.extname(file));
    const sidecarPath = path.join(dir, `${base}.json`);
    const meta = fs.existsSync(sidecarPath) ? readSidecarJson(sidecarPath) : {};
    const src = path.posix.join("/photos", folder, file);
    return {
      src: src,
      title: meta.title,
      description: meta.description,
      id: generateFallbackId(src),
    };
  });
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = norm(params.slug);
  const bySlug = networks.find((n) => norm(n.slug) === p);
  const byHref = networks.find((n) => norm((n.href || "").split("/").pop() || "") === p);
  const net = bySlug || byHref;
  if (!net) return {};
  return { title: `${net.name} — Galerie`, description: `Photos du réseau ${net.name}.` };
}

export default async function NetworkPage({ params }: { params: { slug: string } }) {
  const p = norm(params.slug);
  const net =
    networks.find((n) => norm(n.slug) === p) ||
    networks.find((n) => norm((n.href || "").split("/").pop() || "") === p);

  if (!net) return notFound();

  const folder =
    (net as any).folder ||
    ((net.href || "").split("/").filter(Boolean).pop() || net.slug);

  // Architecture 100% database-driven - AUCUN fallback filesystem
  const photos = await readPhotosFromDatabase(net.slug);
  if (photos.length === 0) {
    console.log(`ℹ️ Aucune photo en BD pour ${net.slug} - importer via l'interface d'admin`);
  }
  const networkSlug = net.slug;

  return (
    <section className="gallery-wrap network-page">
      <nav style={{ marginBottom: 8, opacity: 0.8 }}>
        <Link href="/gallery">← Retour aux réseaux</Link>
      </nav>

      <NetworkPageClient networkName={net.name} photos={photos} networkSlug={networkSlug} />
    </section>
  );
}
