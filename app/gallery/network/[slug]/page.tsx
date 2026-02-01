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
type PhotoItem = { src: string; title?: string; description?: string };

const norm = (s: string) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const photosDir = (folder: string) => path.join(process.cwd(), "public", "photos", folder);

function readSidecarJson(filePath: string): Partial<PhotoItem> {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return {}; }
}

// ← NORMALISE n'importe quel src pour ne garder QUE le nom de fichier
function cleanSrc(folder: string, src: string) {
  let s = String(src || "").replace(/^\.?\//, "");             // ./foo.jpg → foo.jpg ; /foo.jpg → foo.jpg
  s = s.replace(new RegExp(`^/?photos/${folder}/`, "i"), "");  // photos/rer/foo.jpg ou /photos/rer/foo.jpg → foo.jpg
  s = s.replace(new RegExp(`^${folder}/`, "i"), "");           // rer/foo.jpg → foo.jpg
  return s;
}

function readPhotosFromFolder(folder: string): PhotoItem[] {
  const dir = photosDir(folder);
  if (!fs.existsSync(dir)) return [];

  const manifest = path.join(dir, "photos.json");
  if (fs.existsSync(manifest)) {
    try {
      const raw = JSON.parse(fs.readFileSync(manifest, "utf8"));
      const arr: any[] = Array.isArray(raw?.photos) ? raw.photos : Array.isArray(raw) ? raw : [];
      return arr
        .map((p) => (typeof p === "string" ? { src: p } : p))
        .filter((p) => typeof p?.src === "string")
        .map((p) => {
          const file = cleanSrc(folder, p.src);
          return {
            src: path.posix.join("/photos", folder, file),
            title: p.title,
            description: p.description,
          };
        });
    } catch { /* fallback scan */ }
  }

  // Scan des fichiers
  const files = fs.readdirSync(dir);
  const images = files.filter((f) => VALID_EXT.includes(path.extname(f).toLowerCase()));
  return images.map((file) => {
    const base = path.basename(file, path.extname(file));
    const sidecarPath = path.join(dir, `${base}.json`);
    const meta = fs.existsSync(sidecarPath) ? readSidecarJson(sidecarPath) : {};
    return {
      src: path.posix.join("/photos", folder, file),
      title: meta.title,
      description: meta.description,
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

export default function NetworkPage({ params }: { params: { slug: string } }) {
  const p = norm(params.slug);
  const net =
    networks.find((n) => norm(n.slug) === p) ||
    networks.find((n) => norm((n.href || "").split("/").pop() || "") === p);

  if (!net) return notFound();

  const folder =
    (net as any).folder ||
    ((net.href || "").split("/").filter(Boolean).pop() || net.slug);

  const photos = readPhotosFromFolder(folder);
  
  console.log("📸 Photos chargées pour", folder, ":", JSON.stringify(photos, null, 2));

  return (
    <section className="gallery-wrap network-page">
      <nav style={{ marginBottom: 8, opacity: 0.8 }}>
        <Link href="/gallery">← Retour aux réseaux</Link>
      </nav>

      <NetworkPageClient networkName={net.name} photos={photos} />
    </section>
  );
}
