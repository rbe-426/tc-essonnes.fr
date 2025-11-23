"use client";

import { useState, useEffect } from "react";
import { useEditContext } from "@/contexts/EditContext";
import { api } from "@/lib/api";

interface Photo {
  id: string;
  title: string; // Titre original (ne s'affiche pas, pour détecter doublons)
  displayTitle?: string; // Titre affichable (modifiable)
  img: string;
  date?: string;
  desc?: string; // Description originale
  displayDesc?: string; // Description affichable (modifiable)
}

interface EditorPanelProps {
  folder?: string;
}

export default function EditorPanel({ folder }: EditorPanelProps) {
  const { isEditMode, isAuthenticated, logout } = useEditContext();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isEditMode && folder) {
      loadPhotos();
    }
  }, [isEditMode, folder]);

  const loadPhotos = async () => {
    if (!folder) return;
    setLoading(true);
    try {
      const data = await api.photos.getByNetwork(folder);
      if (data.success) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des photos", error);
    } finally {
      setLoading(false);
    }
  };

  const savePhotos = async () => {
    if (!folder) return;
    setSaving(true);
    try {
      // Sauvegarder chaque photo modifiée
      for (const photo of photos) {
        await api.photos.update(folder, photo.id, {
          displayTitle: photo.displayTitle,
          displayDesc: photo.displayDesc,
          date: photo.date,
        });
      }
      setMessage("Photos sauvegardées avec succès");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setMessage("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditingPhoto({ ...photo });
  };

  const handleSavePhoto = () => {
    if (!editingPhoto) return;
    const updatedPhotos = photos.map((p) =>
      p.id === editingPhoto.id ? editingPhoto : p
    );
    setPhotos(updatedPhotos);
    setEditingPhotoId(null);
    setEditingPhoto(null);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleMovePhoto = (id: string, direction: "up" | "down") => {
    const index = photos.findIndex((p) => p.id === id);
    if (direction === "up" && index > 0) {
      const newPhotos = [...photos];
      [newPhotos[index], newPhotos[index - 1]] = [
        newPhotos[index - 1],
        newPhotos[index],
      ];
      setPhotos(newPhotos);
    } else if (direction === "down" && index < photos.length - 1) {
      const newPhotos = [...photos];
      [newPhotos[index], newPhotos[index + 1]] = [
        newPhotos[index + 1],
        newPhotos[index],
      ];
      setPhotos(newPhotos);
    }
  };

  if (!isEditMode || !isAuthenticated) {
    return null;
  }

  return (
    <div
      className="editor-panel"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "400px",
        maxHeight: "100vh",
        backgroundColor: "white",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
        overflow: "auto",
        zIndex: 900,
        borderLeft: "1px solid #ddd",
      }}
    >
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "18px" }}>Panneau d'édition</h3>
        <button
          onClick={logout}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#d32f2f",
            fontWeight: "bold",
          }}
        >
          ✕
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            borderBottom: "1px solid #ddd",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Chargement...
        </div>
      ) : editingPhotoId ? (
        <div style={{ padding: "20px" }}>
          <h4>Éditer la photo</h4>
          {editingPhoto && (
            <>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  Titre original (détection doublons)
                </label>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    fontSize: "12px",
                    borderLeft: "3px solid #999",
                  }}
                >
                  {editingPhoto.title}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Titre affiché (modifiable)
                </label>
                <input
                  type="text"
                  value={editingPhoto.displayTitle || editingPhoto.title}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, displayTitle: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  Description originale
                </label>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    fontSize: "12px",
                    borderLeft: "3px solid #999",
                    minHeight: "40px",
                    wordBreak: "break-word",
                  }}
                >
                  {editingPhoto.desc || "(aucune)"}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Description affichée (modifiable)
                </label>
                <textarea
                  value={editingPhoto.displayDesc || editingPhoto.desc || ""}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, displayDesc: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    minHeight: "80px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  Date
                </label>
                <input
                  type="text"
                  value={editingPhoto.date || ""}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, date: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSavePhoto}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingPhotoId(null)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div style={{ padding: "20px" }}>
            <h4 style={{ marginTop: 0 }}>Photos ({photos.length})</h4>
            <div style={{ maxHeight: "60vh", overflow: "auto" }}>
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                    fontSize: "14px",
                  }}
                >
                  <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                    {photo.displayTitle || photo.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
                    Original: {photo.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => handleEditPhoto(photo)}
                      style={{
                        flex: "1 1 auto",
                        padding: "6px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => handleMovePhoto(photo.id, "up")}
                      disabled={index === 0}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: index === 0 ? "#ccc" : "#FFC107",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: index === 0 ? "default" : "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMovePhoto(photo.id, "down")}
                      disabled={index === photos.length - 1}
                      style={{
                        padding: "6px 8px",
                        backgroundColor:
                          index === photos.length - 1 ? "#ccc" : "#FFC107",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor:
                          index === photos.length - 1 ? "default" : "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "20px", borderTop: "1px solid #ddd" }}>
            <button
              onClick={savePhotos}
              disabled={saving}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
