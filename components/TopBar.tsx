"use client";
import * as React from "react";
import { AppBar, Toolbar, Box, Button } from "@mui/material";
import { Upload, RefreshCw } from "lucide-react";
import ImportPhotosModal from "./ImportPhotosModal";

export default function TopBar() {
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [isLocalhost, setIsLocalhost] = React.useState(false);
  const [isCleaning, setIsCleaning] = React.useState(false);

  React.useEffect(() => {
    setIsLocalhost(typeof window !== "undefined" && window.location.hostname === "localhost");
  }, []);

  const handleCleanup = async () => {
    if (!isLocalhost) return;
    
    setIsCleaning(true);
    try {
      const response = await fetch("http://localhost:3001/api/maintenance/cleanup", {
        method: "POST",
      });
      const data = await response.json();
      alert(data.message || "Nettoyage effectué");
      window.location.reload();
    } catch (error) {
      alert("Erreur lors du nettoyage");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0}
        sx={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <a href="/" aria-label="Accueil">
              <img
                src="/brand/logo-wordmark.png"
                alt="Logo"
                style={{ height: 28, width: "auto", display: "block" }}
              />
            </a>
          </Box>
          <Box sx={{ flex: 1 }} />
          {isLocalhost && (
            <Button
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={handleCleanup}
              disabled={isCleaning}
              sx={{
                color: "#ff6b6b",
                textTransform: "none",
                marginRight: "8px",
                "&:hover": { opacity: 0.8 },
              }}
              title="Nettoyer les photos supprimées de la BD"
            >
              {isCleaning ? "Nettoyage..." : "Nettoyer BD"}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<Upload size={16} />}
            onClick={() => setImportModalOpen(true)}
            sx={{
              color: "inherit",
              textTransform: "none",
              "&:hover": { opacity: 0.8 },
            }}
          >
            Importer photos
          </Button>
        </Toolbar>
      </AppBar>
      <ImportPhotosModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={() => {
          setImportModalOpen(false);
          // Recharger les photos
          window.location.reload();
        }}
      />
    </>
  );
}
