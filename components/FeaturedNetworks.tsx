"use client";

import { networks } from "@/content/networks";
import { readPhotosCount } from "@/lib/photos"; 
import { useEffect, useState } from "react";

export default function FeaturedNetworks() {
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/photos-count");
        const data = await res.json();
        setPhotoCounts(data.counts || {});
      } catch (error) {
        console.error("Failed to fetch photo counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Afficher les 4 premiers réseaux, triés par nombre de photos décroissant
  const featuredNetworks = networks
    .map(net => ({
      slug: net.slug,
      name: net.name,
      count: photoCounts[net.slug] || 0,
      icon: `/icons/network-${net.slug}.png`,
      href: net.href
    }))
    .sort((a, b) => b.count - a.count) // Tri décroissant
    .slice(0, 4);

  return (
    <div className="featured-networks-compact">
      <h3>Réseaux principaux</h3>
      <div className="networks-grid">
        {featuredNetworks.map(net => (
          <a 
            key={net.slug}
            href={net.href}
            className="network-card"
            title={net.name}
          >
            <img 
              src={net.icon} 
              alt={net.name}
              className="network-card-icon"
              onError={(e) => {
                // Fallback si l'icone n'existe pas
                (e.target as HTMLImageElement).src = "/icons/icon-ok.png";
              }}
            />
            <div className="network-card-info">
              <div className="network-card-name">{net.name}</div>
              <div className="network-card-count">{net.count} photos</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
