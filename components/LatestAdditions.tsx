"use client";
import * as React from "react";
import Link from "next/link";
import type { LatestItem } from "../lib/getLatestPhotos";
import ImageWithFallback from "./ImageWithFallback";

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
              <ImageWithFallback
                src={it.src}
                alt={it.title ?? ""}
                slug={it.slug}
                title={it.title}
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
