"use client";

import { useState, useEffect } from "react";

interface Photo {
  src?: string;
  title?: string;
  description?: string;
}

interface PhotoEditModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: Photo) => void;
  folder?: string;
}

export default function PhotoEditModal({
  photo,
  isOpen,
  onClose,
  onSave,
  folder,
}: PhotoEditModalProps) {
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    setEditPhoto(photo);
  }, [photo]);

  if (!isOpen || !photo) return null;

  const handleSave = async () => {
    if (editPhoto) {
      try {
        // Extraire le nom de fichier du src
        const filename = editPhoto.src?.split("/").pop() || "";
        const folder = editPhoto.src?.split("/").slice(-2, -1)[0] || "";

        if (filename && folder) {
          // Appeler l'API pour sauvegarder
          const response = await fetch("/api/local-photos/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folder,
              filename,
              title: editPhoto.title,
              description: editPhoto.description,
            }),
          });

          if (response.ok) {
            console.log("✅ Photo sauvegardée avec succès");
          } else {
            console.error("Erreur lors de la sauvegarde");
          }
        }

        onSave(editPhoto);
        onClose();
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    if (editPhoto) {
      setEditPhoto({
        ...editPhoto,
        [field]: value,
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 24px",
            fontSize: "1.5rem",
            fontWeight: "700",
          }}
        >
          Modifier la photo
        </h2>

        {editPhoto?.src && (
          <div
            style={{
              marginBottom: "20px",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <img
              src={editPhoto.src}
              alt="Preview"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.9rem",
              fontWeight: "600",
              opacity: 0.9,
            }}
          >
            Titre
          </label>
          <input
            type="text"
            value={editPhoto?.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "0.95rem",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.9rem",
              fontWeight: "600",
              opacity: 0.9,
            }}
          >
            Description
          </label>
          <textarea
            value={editPhoto?.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              minHeight: "100px",
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.05)";
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#45a049";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#4CAF50";
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
