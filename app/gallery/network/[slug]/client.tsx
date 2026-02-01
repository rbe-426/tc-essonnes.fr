"use client";

import { useEditContext } from "@/contexts/EditContext";
import PhotoGrid from "../../../../components/PhotoGrid";
import { useState } from "react";

type PhotoItem = { src: string; title?: string; description?: string };

interface NetworkPageClientProps {
  networkName: string;
  photos: PhotoItem[];
}

export default function NetworkPageClient({
  networkName,
  photos,
}: NetworkPageClientProps) {
  const { isEditMode, setIsEditMode } = useEditContext();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", networkName);

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Photos importées avec succès!");
        window.location.reload();
      } else {
        alert("Erreur lors de l'import des photos");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'import");
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.currentTarget) {
        e.currentTarget.value = "";
      }
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0 }}>{networkName}</h1>
          <p className="net-desc">
            Cliquez une vignette pour l'agrandir avec son titre et sa description.
            {isEditMode && " • Double-clic sur le titre pour modifier."}
          </p>
        </div>

        {isEditMode && (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <button
              onClick={() => document.getElementById("photo-upload")?.click()}
              disabled={isUploading}
              style={{
                padding: "8px 16px",
                backgroundColor: isUploading ? "#ccc" : "#2196F3",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                cursor: isUploading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0b7dda";
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2196F3";
                }
              }}
            >
              {isUploading ? "⏳ Upload..." : "➕ Ajouter des photos"}
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#45a049";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#4CAF50";
              }}
            >
              ✏️ EDIT MODE
            </button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.8 }}>
          Aucune photo trouvée.
        </div>
      ) : (
        <PhotoGrid items={photos} />
      )}
    </>
  );
}
