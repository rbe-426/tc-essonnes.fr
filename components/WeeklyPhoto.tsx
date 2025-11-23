"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllNetworkPhotos, pickWeeklyPhoto, type WeeklyPhoto as WeeklyPhotoType } from "@/lib/weeklyPhoto";

export default function WeeklyPhoto() {
  const [photo, setPhoto] = useState<WeeklyPhotoType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Cette fonction s'exécute côté client, mais getAllNetworkPhotos
    // doit être appelée via une API ou un effet côté serveur
    // Pour une meilleure approche, utilisez le composant serveur en dessous
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <article className="bubble-card photo-card">
        <div className="photo-head">Photo du moment</div>
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          Chargement...
        </div>
      </article>
    );
  }

  if (!photo) {
    return (
      <article className="bubble-card photo-card">
        <div className="photo-head">Photo du moment</div>
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

      <div className="photo-head">Photo du moment</div>

      <Link href={photo.href} className="photo-img-wrap" aria-label={photo.title}>
        <img
          src={photo.src}
          alt={photo.title}
          style={{ width: "100%", height: "auto" }}
        />
      </Link>

      <div className="photo-caption">
        <Link href={photo.href} className="photo-caption-link">
          {photo.title}
        </Link>
        {photo.credit ? (
          <>
            {" "}
            — <span style={{ opacity: 0.7 }}>{photo.credit}</span>
          </>
        ) : null}
      </div>
    </article>
  );
}
