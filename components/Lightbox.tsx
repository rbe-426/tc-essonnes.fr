// components/Lightbox.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { getBusBrandBySlug, getBusModelBySlug } from "@/content/busModels";
import { getServerUrl } from "@/lib/serverUrl";
import { useEditContext } from "@/contexts/EditContext";

type Item = { src: string; title?: string; description?: string; brand?: string; model?: string; id?: string; isReformed?: boolean; isPreserved?: boolean };

// Normaliser l'URL de l'image
function normalizeImageUrl(src: string): string {
  console.log("🖼️ [Lightbox] normalizeImageUrl reçu:", src);
  if (src.startsWith("http://") || src.startsWith("https://")) {
    console.log("✅ [Lightbox] URL absolue trouvée:", src);
    return src;
  }
  if (src.startsWith("/api/")) {
    const fullUrl = getServerUrl() + src;
    console.log("🔗 [Lightbox] URL API construite:", fullUrl);
    return fullUrl;
  }
  console.log("📁 [Lightbox] Chemin statique:", src);
  return src;
}

export default function Lightbox({ items }: { items: Item[] }) {
  const { isEditMode } = useEditContext();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [detailedZoom, setDetailedZoom] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftIsReformed, setDraftIsReformed] = useState(false);
  const [draftIsPreserved, setDraftIsPreserved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // fonction globale pour ouvrir
  useEffect(() => {
    (window as any).__openLb = (i: number) => { setIdx(i); setOpen(true); setZoom(1); setPanX(0); setPanY(0); };
    return () => { delete (window as any).__openLb; };
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const prev  = useCallback(() => setIdx(i => (i + items.length - 1) % items.length), [items.length]);
  const next  = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setZoom(z => Math.max(1, Math.min(6, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (detailedZoom) setDetailedZoom(false);
        else close();
      }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, prev, next, detailedZoom]);

  useEffect(() => {
    if (!open) return;
    const handleWheel = (e: WheelEvent) => {
      const container = document.querySelector(".lb-left") as HTMLElement;
      if (container?.contains(e.target as Node)) {
        e.preventDefault();
        setZoom(z => Math.max(1, Math.min(6, z + (e.deltaY > 0 ? -0.1 : 0.1))));
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [open]);

  const it = items[idx];

  useEffect(() => {
    if (!open || !it) return;
    setDraftTitle(it.title || "");
    setDraftDesc(it.description || "");
    setDraftIsReformed(!!it.isReformed);
    setDraftIsPreserved(!!it.isPreserved);
  }, [open, it?.id, it?.title, it?.description, it?.isReformed, it?.isPreserved]);

  if (!open || !items.length || !it) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveMeta = async () => {
    if (!isEditMode) return;
    if (!it?.id) {
      alert("Erreur: photo sans ID");
      return;
    }

    try {
      setIsSaving(true);
      const networkSlug = window.location.pathname.split("/").pop();
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/photos/${networkSlug}/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayTitle: draftTitle,
          displayDesc: draftDesc,
          isReformed: draftIsReformed,
          isPreserved: draftIsPreserved,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Erreur lors de la sauvegarde");
        return;
      }

      window.dispatchEvent(new Event("photos-updated"));
    } catch (error) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // Mode zoom détaillé fullscreen
  if (detailedZoom) {
    return (
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#000",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
        onClick={() => setDetailedZoom(false)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            position: "relative",
            width: "90vw",
            height: "90vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "zoom-in"
          }}
          onClick={() => setDetailedZoom(false)}
          onWheel={handleWheel}
        >
          <img 
            src={normalizeImageUrl(it.src)} 
            alt={it.title || ""} 
            loading="eager"
            decoding="async"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
              transformOrigin: "center",
              transition: zoom === 1 ? "transform 0.2s" : "none",
              userSelect: "none",
              cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "zoom-in",
            }}
          />
          <button 
            className="lb-x" 
            onClick={(e) => {
              e.stopPropagation();
              setDetailedZoom(false);
            }} 
            aria-label="Fermer le zoom"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10001
            }}
          >
            ×
          </button>
          <button
            className="lb-nav lb-prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Précédent"
          >
            ❮
          </button>
          <button
            className="lb-nav lb-next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Suivant"
          >
            ❯
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lb-backdrop" onClick={close} role="dialog" aria-modal="true">
      <div className="lb-modal two-cols" onClick={(e) => e.stopPropagation()}>
        <button className="lb-x" onClick={close} aria-label="Fermer">×</button>

        {/* Colonne image avec zoom */}
        <div 
          className="lb-left" 
          onWheel={handleWheel}
          style={{ 
            overflow: zoom > 1 ? "auto" : "hidden",
            cursor: zoom > 1 ? "zoom-out" : "zoom-in",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000"
          }}
        >
          <img 
            src={normalizeImageUrl(it.src)} 
            alt={it.title || ""} 
            loading="eager"
            decoding="async"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onClick={() => setDetailedZoom(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: zoom > 1 ? "cover" : "contain",
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              transition: zoom === 1 ? "transform 0.2s" : "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              willChange: "transform",
              cursor: "pointer"
            }}
          />
          <button className="lb-nav lb-prev" onClick={prev} aria-label="Précédent">❮</button>
          <button className="lb-nav lb-next" onClick={next} aria-label="Suivant">❯</button>
        </div>

        {/* Colonne texte à droite */}
        <aside className="lb-right">
          {it.brand && (() => {
            const brand = getBusBrandBySlug(it.brand);
            return brand ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ opacity: 0.7 }}>Marque:</span>
                <img src={brand.logo} alt={brand.name} style={{ height: "32px", objectFit: "contain" }} />
                <span>{brand.name}</span>
              </div>
            ) : null;
          })()}
          {it.model && (() => {
            const model = getBusModelBySlug(it.model);
            return model ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ opacity: 0.7 }}>Modèle:</span>
                <img src={model.logo} alt={model.name} style={{ height: "32px", objectFit: "contain" }} />
                <span>{model.name}</span>
              </div>
            ) : null;
          })()}
          {!isEditMode && it.title && <div className="lb-title">{it.title}</div>}
          {!isEditMode && it.description && <div className="lb-desc">{it.description}</div>}

          {isEditMode && (
            <div style={{ display: "grid", gap: "10px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "0.9rem" }}>
                Titre
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "rgba(255,255,255,.06)",
                    color: "#fff",
                    fontFamily: "inherit",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "0.9rem" }}>
                Description
                <textarea
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "90px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "rgba(255,255,255,.06)",
                    color: "#fff",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </label>
              <div style={{ display: "grid", gap: "6px", fontSize: "0.9rem" }}>
                <span>Statut</span>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={draftIsReformed}
                    onChange={(e) => setDraftIsReformed(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span>Véhicule Réformé</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={draftIsPreserved}
                    onChange={(e) => setDraftIsPreserved(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span>Véhicule Préservé</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={isSaving}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2196f3",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
