"use client";

import { useEditContext } from "@/contexts/EditContext";
import PhotoGrid from "../../../../components/PhotoGrid";
import ImportPhotosModal from "../../../../components/ImportPhotosModal";
import { useState } from "react";

type PhotoItem = { src: string; title?: string; description?: string; id?: string; isReformed?: boolean; isPreserved?: boolean };

interface NetworkPageClientProps {
  networkName: string;
  photos: PhotoItem[];
  networkSlug: string;
}
export default function NetworkPageClient({
  networkName,
  photos,
  networkSlug,
}: NetworkPageClientProps) {
  console.log(`🎨 [CLIENT] Rendu galerie ${networkName}, networkSlug="${networkSlug}", photos=${photos.length}`);
  console.log(`🎨 [CLIENT] Détail des photos reçues:`, photos);
  photos.forEach((p, i) => {
    console.log(`   [${i}] src="${p.src}" | title="${p.title}" | id="${p.id}"`);
  });
  
  const { isEditMode, setIsEditMode } = useEditContext();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      console.log("🧹 [handleCleanup] Nettoyage en cours...");
      const response = await fetch("http://localhost:3001/api/maintenance/cleanup", {
        method: "POST",
      });
      const data = await response.json();
      console.log("✅ [handleCleanup] Succès:", data);
      alert(data.message || "Nettoyage effectué");
      window.location.reload();
    } catch (error) {
      console.error("❌ [handleCleanup] Erreur:", error);
      alert("Erreur lors du nettoyage");
    } finally {
      setIsCleaning(false);
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
              ⬆️ Importer photos
            </button>
            <button
              onClick={handleCleanup}
              disabled={isCleaning}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.9rem",
                whiteSpace: "nowrap",
                cursor: isCleaning ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                opacity: isCleaning ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isCleaning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ff5252";
              }}
              onMouseLeave={(e) => {
                if (!isCleaning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ff6b6b";
              }}
              title="Nettoyer les photos supprimées de la BD"
            >
              {isCleaning ? "Nettoyage..." : "🗑️ Nettoyer BD"}
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
        networkSlug={networkSlug}
      />
    </>
  );
}
