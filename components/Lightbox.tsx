// components/Lightbox.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { src: string; title?: string; description?: string };

export default function Lightbox({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  // fonction globale pour ouvrir
  useEffect(() => {
    (window as any).__openLb = (i: number) => { setIdx(i); setOpen(true); setZoom(1); };
    return () => { delete (window as any).__openLb; };
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const prev  = useCallback(() => setIdx(i => (i + items.length - 1) % items.length), [items.length]);
  const next  = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next]);

  useEffect(() => {
    if (!open) return;
    const handleWheel = (e: WheelEvent) => {
      const container = document.querySelector(".lb-left") as HTMLElement;
      if (container?.contains(e.target as Node)) {
        e.preventDefault();
        setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [open]);

  if (!open || !items.length) return null;
  const it = items[idx];

  return (
    <div className="lb-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="lb-modal two-cols" onClick={(e) => e.stopPropagation()}>
        <button className="lb-x" onClick={close} aria-label="Fermer">×</button>

        {/* Colonne image (contain → aucune coupe) */}
        <div 
          className="lb-left" 
          onWheel={handleWheel}
          style={{ 
            overflow: "auto", 
            cursor: zoom > 1 ? "grab" : "auto",
            position: "relative"
          }}
        >
          <img 
            src={it.src} 
            alt={it.title || ""} 
            loading="eager"
            decoding="async"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              transition: zoom === 1 ? "transform 0.2s" : "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              willChange: "transform",
            }}
          />
          <button className="lb-nav lb-prev" onClick={prev} aria-label="Précédent">❮</button>
          <button className="lb-nav lb-next" onClick={next} aria-label="Suivant">❯</button>
        </div>

        {/* Colonne texte à droite */}
        <aside className="lb-right">
          {it.title && <div className="lb-title">{it.title}</div>}
          {it.description && <div className="lb-desc">{it.description}</div>}
        </aside>
      </div>
    </div>
  );
}
