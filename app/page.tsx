// app/page.tsx
import "../styles/home.css";
import AnecdoteCard from "../components/AnecdoteCard";
import WeeklyPhoto from "../components/WeeklyPhoto";
import { DiscordWidget } from "../components/PhotoOfMonth";

import { getLatestPhotos } from "../lib/getLatestPhotos";
import LatestAdditions from "../components/LatestAdditions";

export default function HomePage() {
  const latest = getLatestPhotos(20);

  return (
    <section className="home-wrap">
      <h1 className="home-title">TCE Photos - Photothèque</h1>

      <div className="home-grid">
        {/* COLONNE GAUCHE */}
        <div className="home-left">
          {/* HERO SECTION */}
          <section className="bubble hero-section">
            <h2>Découvrez ma collection</h2>
            <p>
              Une photothèque complète dédiée aux transports en Île-de-France. 
              Explorez des centaines de clichés des réseaux les plus emblématiques de la région.
            </p>
            <a href="/gallery" className="cta-button">Explorer la galerie</a>
          </section>

          {/* STATS */}
          <section className="bubble stats-section">
            <h3>Par les chiffres</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">1250+</span>
                <span className="stat-label">Photos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">12</span>
                <span className="stat-label">Réseaux</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5+</span>
                <span className="stat-label">Années</span>
              </div>
            </div>
          </section>

          {/* RÉSEAUX EN VEDETTE */}
          <section className="bubble featured-networks">
            <h3>Réseaux principaux</h3>
            <div className="networks-list">
              <a href="/gallery/tisse" className="network-link">
                <span className="network-icon">🚇</span>
                <span className="network-name">TISSE</span>
                <span className="network-count">180+ photos</span>
              </a>
              <a href="/gallery/ratp" className="network-link">
                <span className="network-icon">🚌</span>
                <span className="network-name">RATP</span>
                <span className="network-count">250+ photos</span>
              </a>
              <a href="/gallery/reseau-ksvm" className="network-link">
                <span className="network-icon">🚍</span>
                <span className="network-name">KSVM</span>
                <span className="network-count">120+ photos</span>
              </a>
              <a href="/gallery/rer" className="network-link">
                <span className="network-icon">🚆</span>
                <span className="network-name">RER</span>
                <span className="network-count">95+ photos</span>
              </a>
            </div>
          </section>

          {/* DERNIERS ARRIVAGES */}
          <section className="bubble tce-latest-card">
            <header className="bubble-head tce-latest-head">
              <img src="/icons/icon-ok.png" alt="" className="tce-latest-icon" />
              <h3>Derniers Arrivages</h3>
            </header>
            <LatestAdditions items={latest} initial={5} />
          </section>
        </div>

        {/* COLONNE DROITE - CONSERVÉE INTACTE */}
        <div className="home-side">
          <AnecdoteCard />
          <WeeklyPhoto />
          <DiscordWidget />
        </div>
      </div>
    </section>
  );
}
