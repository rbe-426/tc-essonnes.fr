// components/PhotoGrid.tsx
"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import PhotoEditModal from "./PhotoEditModal";
import { useEditContext } from "@/contexts/EditContext";
import { getServerUrl } from "@/lib/serverUrl";

type Item = { src: string; title?: string; description?: string; brand?: string; model?: string; id?: string; date?: string; createdAt?: string };

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

function parseDateValue(value?: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// Normaliser l'URL de l'image - ajouter le serverUrl si relatif
function normalizeImageUrl(src: string): string {
  console.log("🖼️ [normalizeImageUrl] src reçu:", src);
  if (src.startsWith("http://") || src.startsWith("https://")) {
    console.log("✅ [normalizeImageUrl] Déjà absolu:", src);
    return src; // Déjà absolu
  }
  if (src.startsWith("/api/")) {
    const fullUrl = getServerUrl() + src;
    console.log("🔗 [normalizeImageUrl] Construit URL complète:", fullUrl);
    return fullUrl; // Ajouter le serverUrl
  }
  console.log("📁 [normalizeImageUrl] Chemin fichier statique:", src);
  return src; // Supposément un chemin fichier statique
}

export default function PhotoGrid({ items: initialItems }: { items: Item[] }) {
  console.log("🖼️ [PhotoGrid] Initialisation avec", initialItems.length, "items");
  initialItems.forEach((item, i) => {
    console.log(`   Item ${i}: src=${item.src}, title=${item.title}`);
  });
  
  const { isEditMode } = useEditContext();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [editingPhoto, setEditingPhoto] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Item | null>(null);

  // Tri automatique par numéro en début de titre
  const sortedItems = [...items].sort((a, b) => {
    const dateA = parseDateValue(a.date) ?? parseDateValue(a.createdAt);
    const dateB = parseDateValue(b.date) ?? parseDateValue(b.createdAt);

    if (dateA !== null && dateB !== null) {
      return dateB - dateA; // plus recentes d'abord
    }

    if (dateA !== null) return -1;
    if (dateB !== null) return 1;

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

  const handleDelete = async (e: React.MouseEvent, photo: Item) => {
    e.stopPropagation();
    const title = photo.title || fileTitleFallback(photo.src);
    if (!confirm(`Supprimer "${title}"?`)) return;

    try {
      const networkSlug = window.location.pathname.split("/").pop();
      const serverUrl = getServerUrl();
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      
      // Must have id from DB
      if (!photo.id) {
        console.error("❌ Photo n'a pas d'ID - elle vient pas de la BD", photo);
        alert("Erreur: Photo sans ID (non synchronisée en BD)");
        return;
      }
      
      const response = await fetch(`${serverUrl}/api/photos/${networkSlug}/${photo.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setItems(items.filter(p => p.src !== photo.src));
        alert("Photo supprimée!");
        // Émettre un event pour que l'accueil se recharge
        window.dispatchEvent(new Event("photos-updated"));
      } else {
        console.error("Erreur serveur:", data);
        alert(`Erreur: ${data.message || "Suppression échouée"}`);
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleEditButton = (e: React.MouseEvent, photo: Item) => {
    e.stopPropagation();
    setEditingPhoto(photo);
    setIsModalOpen(true);
  };

  const handleSavePhoto = (updatedPhoto: Item) => {
    console.log("Photo mise à jour:", updatedPhoto);
    setIsModalOpen(false);
    // Émettre un event pour que l'accueil se recharge
    window.dispatchEvent(new Event("photos-updated"));
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
              <div
                className="photo-card"
                onClick={() => (window as any).__openLb?.(sortedItems.indexOf(p))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    (window as any).__openLb?.(sortedItems.indexOf(p));
                  }
                }}
                aria-label={title ? `Agrandir : ${title}` : "Agrandir la photo"}
                style={{ cursor: "pointer" }}
              >
                <div className="photo-thumb">
                  <img 
                    src={normalizeImageUrl(p.src)} 
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
              </div>

              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, p)}
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      background: "rgba(244, 67, 54, 0.2)",
                      border: "1px solid #F44336",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#F44336",
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  >
                    🗑️ Supprimer
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleEditButton(e, p)}
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
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  >
                    ✏️ Éditer
                  </button>
                </>
              )}
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
            onClick={(e) => handleEditButton(e, selectedPhoto!)}
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
