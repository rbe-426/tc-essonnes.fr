import Link from "next/link";
import type { LatestItem } from "@/lib/getLatestPhotos";
import { getLatestPhotos } from "@/lib/getLatestPhotos";
import ImageWithFallback from "./ImageWithFallback";

// Fonction pour calculer le seed basé sur la semaine (dimanche 18h UTC)
function getWeekSeed(): number {
  const now = new Date();
  const utcTime = now.getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const referenceTime = new Date("1970-01-04T18:00:00Z").getTime();
  const weeksSinceReference = Math.floor((utcTime - referenceTime) / msPerWeek);
  const lastSundayAtSix = referenceTime + weeksSinceReference * msPerWeek;
  return Math.floor(lastSundayAtSix / 1000);
}

// Fonction simple pour générer un nombre pseudo-aléatoire déterministe
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default async function WeeklyPhoto() {
  try {
    const latest = await getLatestPhotos(100);
    
    if (!latest || latest.length === 0) {
      return (
        <article className="bubble-card photo-card">
          <div className="photo-head">Photo de la semaine</div>
          <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
            Photo non disponible
          </div>
        </article>
      );
    }

    // Utiliser le seed basé sur la semaine (même calcul que l'API)
    const seed = getWeekSeed();
    const randomIndex = Math.floor(seededRandom(seed) * latest.length);
    const photo = latest[randomIndex];

    if (!photo) {
      return (
        <article className="bubble-card photo-card">
          <div className="photo-head">Photo de la semaine</div>
          <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
            Photo non disponible
          </div>
        </article>
      );
    }

    return (
      <article className="bubble-card photo-card">
        <span className="bubble-pin bubble-pin--right" aria-hidden="true">
          <img src="/icons/icon-heart.png" alt="" />
        </span>

        <div className="photo-head">Photo de la semaine</div>

        <Link 
          href={`/gallery/network/${photo.slug}?photo=${encodeURIComponent(photo.src)}`}
          className="photo-img-wrap" 
          style={{ cursor: "pointer", display: "block" }}
          title="Voir cette photo dans la galerie"
        >
          <ImageWithFallback
            src={photo.src}
            alt={photo.title || "Photo"}
            slug={photo.slug}
            title={photo.title}
            style={{ width: "100%", height: "auto", borderRadius: "8px" }}
          />
        </Link>

        <div className="photo-caption">
          <span style={{ fontWeight: 600, color: "#fff", display: "block", marginBottom: "8px" }}>
            {photo.title || "Photo de la semaine"}
          </span>
          <Link 
            href={`/gallery/network/${photo.slug}`}
            style={{ fontSize: "0.85rem", opacity: 0.7, textDecoration: "none", color: "inherit" }}
          >
            → Voir la galerie
          </Link>
        </div>
      </article>
    );
  } catch (error) {
    console.error("Error fetching weekly photo:", error);
    return (
      <article className="bubble-card photo-card">
        <div className="photo-head">Photo de la semaine</div>
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          Erreur de chargement
        </div>
      </article>
    );
  }
}
