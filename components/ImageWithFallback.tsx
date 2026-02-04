"use client";

import { useState, useEffect } from "react";
import { getServerUrl } from "@/lib/serverUrl";

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
  const [useFallback, setUseFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(false);

  const primaryUrl = src ? normalizeImageUrl(src) : null;
  const fallbackUrl = `/photos/${slug}/${title || "photo"}.webp`;
  const displayUrl = useFallback || !primaryUrl ? fallbackUrl : primaryUrl;

  // Retry avec délai si l'API n'est pas prête
  const handleError = () => {
    if (!useFallback && retryCount < 2) {
      console.warn(`⚠️ Image load failed (retry ${retryCount + 1}/2):`, { slug, title });
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      
      // Retry après 1.5 secondes (laisser le backend démarrer)
      setTimeout(() => {
        setShouldRetry(prev => !prev);
      }, 1500);
    } else {
      console.warn(`⚠️ Image API unavailable, using fallback:`, { slug, title });
      setUseFallback(true);
    }
    setIsLoading(false);
  };

  return (
    <img
      key={`${displayUrl}-${shouldRetry}`}
      src={displayUrl}
      alt={alt}
      style={{
        ...style,
        backgroundColor: isLoading ? "#e8e8e8" : undefined,
        transition: "background-color 0.2s",
      }}
      onError={handleError}
      onLoad={() => {
        setIsLoading(false);
        setRetryCount(0); // Reset après succès
      }}
    />
  );
}
