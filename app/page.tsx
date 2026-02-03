// app/page.tsx
import "../styles/home.css";
import AnecdoteCard from "../components/AnecdoteCard";
import WeeklyPhoto from "../components/WeeklyPhoto";
import FeaturedNetworks from "../components/FeaturedNetworks";
import { DiscordWidget } from "../components/PhotoOfMonth";
import StatsSection from "../components/StatsSection";

import { getLatestPhotos } from "../lib/getLatestPhotos";
import LatestAdditionsWrapper from "../components/LatestAdditionsWrapper";

export default async function HomePage() {
  const latest = await getLatestPhotos(20);

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
          <StatsSection />

          {/* DERNIERS ARRIVAGES */}
          <section className="bubble tce-latest-card">
            <header className="bubble-head tce-latest-head">
              <img src="/icons/icon-ok.png" alt="" className="tce-latest-icon" />
              <h3>Derniers Arrivages</h3>
            </header>
            <LatestAdditionsWrapper initialItems={latest} initial={5} />
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="home-side">
          <AnecdoteCard />
          <WeeklyPhoto />
          <FeaturedNetworks />
          <DiscordWidget />
        </div>
      </div>
    </section>
  );
}
