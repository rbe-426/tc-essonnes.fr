// components/PhotoGrid.tsx
"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import PhotoEditModal from "./PhotoEditModal";
import { useEditContext } from "@/contexts/EditContext";

type Item = { src: string; title?: string; description?: string };

function fileTitleFallback(src: string) {
  try {
    const base = src.split("/").pop() || "";
    return base.replace(/\.[^.]+$/, "");
  } catch { return ""; }
}

function extractNumberFromTitle(title: string): number {
  const match = title.match(/^\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

export default function PhotoGrid({ items }: { items: Item[] }) {
  const { isEditMode } = useEditContext();
  const [editingPhoto, setEditingPhoto] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Item | null>(null);

  // Tri automatique par numéro en début de titre
  const sortedItems = [...items].sort((a, b) => {
    const titleA = a.title || fileTitleFallback(a.src);
    const titleB = b.title || fileTitleFallback(b.src);
    const numA = extractNumberFromTitle(titleA);
    const numB = extractNumberFromTitle(titleB);
    return numA - numB;
  });

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, photo: Item) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedPhoto(photo);
  };

  const handleEdit = () => {
    if (selectedPhoto) {
      setEditingPhoto(selectedPhoto);
      setIsModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleSavePhoto = (updatedPhoto: Item) => {
    console.log("Photo mise à jour:", updatedPhoto);
    setIsModalOpen(false);
  };

  // Fermer le menu au clic ailleurs
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <>
      <div className="photo-grid" style={{ marginTop: 16 }} onClick={handleCloseContextMenu}>
        {sortedItems.map((p) => {
          const title = p.title || fileTitleFallback(p.src);
          return (
            <div
              key={p.src}
              style={{
                position: "relative",
              }}
              onContextMenu={(e) => handleContextMenu(e, p)}
            >
              <button
                type="button"
                className="photo-card"
                onClick={() => (window as any).__openLb?.(sortedItems.indexOf(p))}
                aria-label={title ? `Agrandir : ${title}` : "Agrandir la photo"}
              >
                <div className="photo-thumb">
                  <img 
                    src={p.src} 
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div className="photo-meta">
                  {title ? <div className="photo-title">{title}</div> : null}
                </div>

                {isEditMode && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "rgba(76, 175, 80, 0.2)",
                      border: "1px solid #4CAF50",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#4CAF50",
                      pointerEvents: "none",
                      opacity: 0.7,
                    }}
                  >
                    ✏️ Éditer
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Lightbox client */}
      <Lightbox items={sortedItems} />

      {/* Menu contextuel */}
      {contextMenu && isEditMode && (
        <div
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: "rgba(30, 30, 30, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            padding: "8px 0",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            minWidth: "160px",
          }}
          onClick={handleCloseContextMenu}
        >
          <button
            onClick={handleEdit}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: "none",
              color: "#4CAF50",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.95rem",
              fontWeight: "600",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(76, 175, 80, 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            ✏️ Éditer
          </button>
        </div>
      )}

      {/* Modale d'édition */}
      <PhotoEditModal
        photo={editingPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePhoto}
      />
    </>
  );
}
