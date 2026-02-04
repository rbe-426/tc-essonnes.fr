"use client";
import * as React from "react";
import Link from "next/link";
import type { LatestItem } from "../lib/getLatestPhotos";
import { getServerUrl } from "@/lib/serverUrl";

function normalizeImageUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/api/")) {
    return getServerUrl() + src;
  }
  return src;
}

export default function LatestAdditions({ items, initial = 5 }:{
  items: LatestItem[]; initial?: number;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const shown = showAll ? items : items.slice(0, initial);

  return (
    <div className="latest-wrap">
      <div className="latest-grid">
        {shown.map((it, i) => (
          <Link key={i} href={it.href} className="latest-item" title={it.title ?? ""}>
            <div className="latest-thumb">
              <img 
                src={normalizeImageUrl(it.src)} 
                alt={it.title ?? ""} 
                onError={(e) => {
                  // Fallback to filesystem if API fails
                  if (!e.currentTarget.src.includes("/photos/")) {
                    const slug = it.href.split("/").pop();
                    e.currentTarget.src = `/photos/${slug}/${it.title || "photo"}.webp`;
                  }
                }}
              />
            </div>
            <div className="latest-meta"><div className="latest-title">{it.title ?? "\u00A0"}</div></div>
          </Link>
        ))}
      </div>
      {items.length > initial && (
        <button className="latest-more" onClick={() => setShowAll(s => !s)}>
          {showAll ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}
