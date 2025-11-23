// app/page.tsx
import "../styles/home.css";
import AnecdoteCard from "../components/AnecdoteCard";
import WeeklyPhoto from "../components/WeeklyPhoto";

import { getLatestPhotos } from "../lib/getLatestPhotos";
import LatestAdditions from "../components/LatestAdditions";

export default function HomePage() {
  const latest = getLatestPhotos(20);

  return (
    <section className="home-wrap">
      <h1 className="home-title">Bienvenue sur TCE Photos</h1>

      <div className="home-grid">
        {/* COLONNE GAUCHE */}
        <div className="home-left">
          <section className="bubble home-welcome">
            <h1>Bienvenue sur le site Photos TC&nbsp;Essonnes</h1>
            <p>
              Bienvenue sur mon site photothèque.
              Ce site regroupe mes photos ainsi que d'autres essentiels à connaitre sur mon activité photographique
            </p>
          </section>

          <section className="bubble tce-latest-card">
            <header className="bubble-head tce-latest-head">
              <img src="/icons/ok.svg" alt="" className="tce-latest-icon" />
              <h3>Les derniers ajouts</h3>
            </header>
            <LatestAdditions items={latest} initial={5} />
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="home-side">
          <AnecdoteCard />
          <WeeklyPhoto />
        </div>
      </div>
    </section>
  );
}
