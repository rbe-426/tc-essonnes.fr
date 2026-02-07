import Link from "next/link";
import type { LatestItem } from "@/lib/getLatestPhotos";
import ImageWithFallback from "./ImageWithFallback";

type BadgeVariant = "reformed" | "preserved";

function getBadges(photo: LatestItem): { text: string; variant: BadgeVariant }[] {
  const badges: { text: string; variant: BadgeVariant }[] = [];
  if (photo.isReformed) badges.push({ text: "Véhicule Réformé", variant: "reformed" });
  if (photo.isPreserved) badges.push({ text: "Véhicule Préservé", variant: "preserved" });
  return badges;
}

function badgeStyle(variant: BadgeVariant) {
  const bg = variant === "reformed" ? "#c62828" : "#2e7d32";
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "#fff",
    backgroundColor: bg,
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
  } as const;
}

async function getWeeklyPhoto(): Promise<LatestItem | null> {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  const response = await fetch(`${backendUrl}/api/photos/weekly-photo`, { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json();
  return data.photo || null;
}

export default async function WeeklyPhoto() {
  try {
    const photo = await getWeeklyPhoto();

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

    const badges = getBadges(photo);

    return (
      <article className="bubble-card photo-card">
        <span className="bubble-pin bubble-pin--right" aria-hidden="true">
          <img src="/icons/icon-heart.png" alt="" />
        </span>

        <div className="photo-head">Photo de la semaine</div>

        <Link 
          href={`/gallery/network/${photo.slug}?photo=${encodeURIComponent(photo.src)}`}
          className="photo-img-wrap" 
          style={{ cursor: "pointer", display: "block", position: "relative" }}
          title="Voir cette photo dans la galerie"
        >
          {badges.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              {badges.map((badge) => (
                <span key={badge.variant} style={badgeStyle(badge.variant)}>
                  {badge.text}
                </span>
              ))}
            </div>
          )}
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
