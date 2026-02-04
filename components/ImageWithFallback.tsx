"use client";

import { useState, useEffect, useRef } from "react";
import { getServerUrl } from "@/lib/serverUrl";
import styles from "./ImageWithFallback.module.css";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  slug: string;
  title?: string | null;
  style?: React.CSSProperties;
}

function normalizeImageUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/api/")) {
    return getServerUrl() + src;
  }
  return src;
}

export default function ImageWithFallback({
  src,
  alt,
  slug,
  title,
  style,
}: ImageWithFallbackProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryUrl = src ? normalizeImageUrl(src) : null;
  const thumbUrl = primaryUrl?.replace("/image/", "/thumb/");
  const fallbackUrl = `/photos/${slug}/${title || "photo"}.webp`;

  // Lazy loading avec Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleThumbError = () => {
    // Si le thumbnail échoue, passer directement à l'image full
    setThumbLoaded(true);
  };

  const handleFullError = () => {
    console.warn(`⚠️ Image full échouée:`, { slug, title });
    setUseFallback(true);
    setFullLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: "auto",
        backgroundColor: "#f0f0f0",
        ...style,
      }}
      className={styles.container}
    >
      {/* Spinner pendant le chargement initial */}
      {!thumbLoaded && !fullLoaded && isVisible && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* Thumbnail rapide (LQIP - Low Quality Image Placeholder) */}
      {isVisible && thumbUrl && !fullLoaded && (
        <img
          key={`thumb-${thumbUrl}`}
          src={thumbUrl}
          alt={alt}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            filter: "blur(15px)",
            opacity: thumbLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
          onLoad={() => setThumbLoaded(true)}
          onError={handleThumbError}
        />
      )}

      {/* Image full resolution - visible, crée l'espace */}
      {isVisible && primaryUrl && (
        <img
          key={`full-${primaryUrl}`}
          src={useFallback ? fallbackUrl : primaryUrl}
          alt={alt}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            opacity: fullLoaded ? 1 : 0.1,
            transition: "opacity 0.4s ease-in-out",
            zIndex: 2,
          }}
          onLoad={() => {
            setFullLoaded(true);
            setThumbLoaded(true);
          }}
          onError={handleFullError}
        />
      )}

      {/* SVG placeholder qui maintient les proportions (1:1 par défaut) */}
      {!fullLoaded && isVisible && !primaryUrl && (
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23f0f0f0' width='1' height='1'/%3E%3C/svg%3E"
          alt=""
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
