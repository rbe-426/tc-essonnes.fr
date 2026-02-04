"use client";

import { useState } from "react";
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

  const primaryUrl = src ? normalizeImageUrl(src) : null;
  const fallbackUrl = `/photos/${slug}/${title || "photo"}.webp`;
  const displayUrl = useFallback || !primaryUrl ? fallbackUrl : primaryUrl;

  return (
    <img
      src={displayUrl}
      alt={alt}
      style={style}
      onError={() => {
        if (!useFallback) {
          console.warn("Image API failed, using filesystem fallback:", { src, slug, title });
          setUseFallback(true);
        }
      }}
    />
  );
}
