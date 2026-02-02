"use client";

import { useState } from "react";
import { getServerUrl } from "@/lib/serverUrl";

type PhotoItem = { src: string; title?: string; description?: string };

interface ImportPhotosModalProps {
  isOpen: boolean;
  photos: PhotoItem[];
  folder: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ImportPhotosModal({
  isOpen,
  photos,
  folder,
  onClose,
  onSave,
}: ImportPhotosModalProps) {
  const [editedPhotos, setEditedPhotos] = useState<PhotoItem[]>(photos);
  const [isSaving, setIsSaving] = useState(false);

  console.log("🎬 ImportPhotosModal - isOpen:", isOpen, "photos:", photos);

  if (!isOpen) return null;

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...editedPhotos];
    updated[index].title = newTitle;
    setEditedPhotos(updated);
  };

  const handleDescriptionChange = (index: number, newDesc: string) => {
    const updated = [...editedPhotos];
    updated[index].description = newDesc;
    setEditedPhotos(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/local-photos/save-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          photos: editedPhotos,
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          maxHeight: "80vh",
          width: "90%",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.5rem" }}>
          Éditer les photos importées
        </h2>

        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {editedPhotos.map((photo, index) => (
            <div
              key={photo.src}
              style={{
                marginBottom: "20px",
                paddingBottom: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Titre"
                    value={photo.title || ""}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      marginBottom: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontWeight: "600",
                    }}
                  />
                  <textarea
                    placeholder="Description"
                    value={photo.description || ""}
                    onChange={(e) =>
                      handleDescriptionChange(index, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      minHeight: "60px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f0f0f0",
              border: "none",
              borderRadius: "4px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontWeight: "600",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontWeight: "600",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            {isSaving ? "⏳ Sauvegarde..." : "✅ Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
