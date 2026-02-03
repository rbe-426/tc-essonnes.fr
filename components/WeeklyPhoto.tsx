"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/photos";

export default function WeeklyPhoto() {
  const [photo, setPhoto] = useState<(Photo & { network: string; href: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer une photo aléatoire via l'API
    const fetchRandomPhoto = async () => {
      try {
        const res = await fetch("/api/random-photo");
        const data = await res.json();
        setPhoto(data.photo);
      } catch (error) {
        console.error("Failed to fetch random photo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomPhoto();
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

      <div className="photo-head">Photo de la semaine</div>

      <Link 
        href={`/gallery/network/${photo.slug}?photo=${encodeURIComponent(photo.src)}`}
        className="photo-img-wrap" 
        style={{ cursor: "pointer", display: "block" }}
        title="Voir cette photo dans la galerie"
      >
        <img
          src={photo.src}
          alt={photo.title}
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
        />
      </Link>

      <div className="photo-caption">
        <span style={{ fontWeight: 600, color: "#fff", display: "block", marginBottom: "8px" }}>
          {photo.title}
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
}
