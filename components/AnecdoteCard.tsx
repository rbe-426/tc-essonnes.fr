// components/AnecdoteCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { anecdotes } from "../content/anecdotes";

/** Durée d’un cycle en minutes (mets 30 si tu préfères) */
const CYCLE_MINUTES = 20;
const CYCLE_MS = CYCLE_MINUTES * 60 * 1000;

/** Index déterministe basé sur le nombre de cycles écoulés */
function idxByCycle(d = new Date(), len = anecdotes.length) {
  if (!len) return 0;
  const cyclesSinceEpoch = Math.floor(d.getTime() / CYCLE_MS);
  return cyclesSinceEpoch % len;
}

/** Millisecondes jusqu’à la prochaine frontière de cycle (00/20/40…) */
function msUntilNextCycle(d = new Date()) {
  const now = d.getTime();
  const next = Math.ceil(now / CYCLE_MS) * CYCLE_MS;
  return Math.max(0, next - now);
}

export default function AnecdoteCard() {
  const [idx, setIdx] = useState<number>(() => idxByCycle());

  useEffect(() => {
    let to: ReturnType<typeof setTimeout> | null = null;
    let iv: ReturnType<typeof setInterval> | null = null;

    // 1) On se cale pile sur la prochaine frontière (00/20/40…)
    to = setTimeout(() => {
      setIdx(idxByCycle());
      // 2) Puis on met à jour toutes les CYCLE_MS ensuite
      iv = setInterval(() => setIdx(idxByCycle()), CYCLE_MS);
    }, msUntilNextCycle() + 20); // petite marge

    return () => {
      if (to) clearTimeout(to);
      if (iv) clearInterval(iv);
    };
  }, []);

  const anecdote = useMemo(
    () => (anecdotes && anecdotes.length ? anecdotes[idx] : "Anecdote à venir…"),
    [idx]
  );

  return (
    <article className="bubble-card anec-card" aria-live="polite">
      {/* pastille flottante à DROITE (inchangée) */}
      <span className="bubble-pin bubble-pin--right" aria-hidden="true">
        <img src="/icons/icon-info.png" alt="" />
      </span>

      <div className="bubble-title">Le Saviez Vous ?</div>
      <p className="anec-text">{anecdote}</p>
    </article>
  );
}
