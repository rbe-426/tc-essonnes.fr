"use client";

import { useEditContext } from "@/contexts/EditContext";
import PhotoGrid from "../../../../components/PhotoGrid";
import ImportPhotosModal from "../../../../components/ImportPhotosModal";
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
            <button
              onClick={() => setIsImportModalOpen(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
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
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0b7dda";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2196F3";
              }}
            >
              ⬆️ Importer JSON
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

      <ImportPhotosModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
        }}
        onImportComplete={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
