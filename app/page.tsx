// app/page.tsx
import "../styles/home.css";
import AnecdoteCard from "../components/AnecdoteCard";
import WeeklyPhoto from "../components/WeeklyPhoto";
import FeaturedNetworks from "../components/FeaturedNetworks";
import { DiscordWidget } from "../components/PhotoOfMonth";
import StatsSection from "../components/StatsSection";
import EditableText from "../components/EditableText";

import { getLatestPhotos } from "../lib/getLatestPhotos";
import LatestAdditionsWrapper from "../components/LatestAdditionsWrapper";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latest = await getLatestPhotos(20);

  return (
    <section className="home-wrap">
      <h1 className="home-title">TCE Photos - Photothèque</h1>

      <div className="home-grid">
        {/* COLONNE GAUCHE */}
        <div className="home-left">
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

          {/* ACTUALITÉS SECTION */}
          <section className="bubble hero-section">
            <h2>Les dernières Actualités de TC</h2>
            <EditableText 
              id="hero-text"
              defaultText="Une photothèque complète dédiée aux transports en Île-de-France. Explorez des centaines de clichés des réseaux les plus emblématiques de la région."
            />
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
