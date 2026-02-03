"use client";
import * as React from "react";
import { AppBar, Toolbar, Box, Button } from "@mui/material";
import { Upload } from "lucide-react";
import ImportPhotosModal from "./ImportPhotosModal";

export default function TopBar() {
  const [importModalOpen, setImportModalOpen] = React.useState(false);

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
