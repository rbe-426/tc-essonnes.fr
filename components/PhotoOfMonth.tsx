// components/PhotoOfMonth.tsx
"use client";

import Link from "next/link";
import { pickSpotlight } from "../content/spotlight";

export default function PhotoOfMonth() {
  const sp = pickSpotlight();
  return (
    <article className="bubble-card photo-card">
      <span className="bubble-pin bubble-pin--right" aria-hidden="true">
        <img src="/icons/icon-heart.png" alt="" />
      </span>

      <div className="photo-head">Photo du moment</div>

      <Link href={sp.href ?? "#"} className="photo-img-wrap" aria-label={sp.title}>
        <img src={sp.src} alt={sp.title} />
      </Link>

      {/* le titre dessous mène aussi vers la page adéquate */}
      <div className="photo-caption">
        <Link href={sp.href ?? "#"} className="photo-caption-link">{sp.title}</Link>
        {sp.credit ? <> — <span style={{opacity:.7}}>{sp.credit}</span></> : null}
      </div>
    </article>
  );
}

export function DiscordWidget() {
  return (
    <div className="discord-widget-wrap">
      <iframe 
        src="https://discord.com/widget?id=1078513042599444582&theme=dark" 
        width="100%" 
        height="500" 
        allowTransparency="true"
        frameBorder="0" 
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        style={{ minWidth: "300px" }}
      />
    </div>
  );
}
