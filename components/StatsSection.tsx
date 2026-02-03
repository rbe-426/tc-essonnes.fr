"use client";

import { useEffect, useState } from "react";

interface StatsData {
  totalPhotos: number;
  totalNetworks: number;
  yearsActive: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="bubble stats-section">
        <h3>Par les chiffres</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">---</span>
            <span className="stat-label">Photos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">---</span>
            <span className="stat-label">Réseaux</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">---</span>
            <span className="stat-label">Années</span>
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="bubble stats-section">
      <h3>Par les chiffres</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{stats.totalPhotos}+</span>
          <span className="stat-label">Photos</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalNetworks}</span>
          <span className="stat-label">Réseaux</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.yearsActive}+</span>
          <span className="stat-label">Années</span>
        </div>
      </div>
    </section>
  );
}
