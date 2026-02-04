"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader, Save, Trash2, Minus } from "lucide-react";

// Importer Montserrat de Google Fonts
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

interface PhotoData {
  file: File;
  preview: string;
  title: string;
  desc: string;
}

interface ImportPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function ImportPhotosModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportPhotosModalProps) {
  const [step, setStep] = useState<"upload" | "edit" | "success" | "error">("upload");
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea")) return;
    
    setIsDraggingWindow(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWindow && windowRef.current) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
    };

    if (isDraggingWindow) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingWindow, dragOffset]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoData[] = [];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({
            file,
            preview: e.target?.result as string,
            title: file.name.replace(/\.[^/.]+$/, ""),
            desc: "",
          });
          loadedCount++;

          if (loadedCount === Array.from(files).filter(f => f.type.startsWith("image/")).length) {
            setPhotos([...photos, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      photos.forEach((photo, idx) => {
        formData.append("files", photo.file);
        formData.append(`titles[${idx}]`, photo.title);
        formData.append(`descriptions[${idx}]`, photo.desc);
      });

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep("success");
        setMessage(`${photos.length} photo(s) sauvegardée(s) en base de données`);
        setPhotos([]);
        onImportComplete?.();
      } else {
        setStep("error");
        setMessage(data.message || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setStep("error");
      setMessage(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updatePhoto = (index: number, field: "title" | "desc", value: string) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], [field]: value };
    setPhotos(updated);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .popup-window {
          animation: slideIn 0.2s ease-out;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        ref={windowRef}
        className="popup-window"
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isMinimized ? "350px" : "750px",
          height: isMinimized ? "30px" : "650px",
          minWidth: "300px",
          maxWidth: "95vw",
          maxHeight: "95vh",
          backgroundColor: "#2a2a2a",
          border: "2px solid #444",
          borderRadius: "6px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: montserrat.style.fontFamily,
          fontSize: "13px",
          color: "#e0e0e0",
          zIndex: 1000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            backgroundColor: "#404040",
            borderBottom: "1px solid #555",
            cursor: "move",
            userSelect: "none",
            borderRadius: "4px 4px 0 0",
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "bold" }}>
            <Upload size={14} style={{ color: "#0ea5e9" }} />
            <span>Importer photos</span>
          </div>
          <div style={{ display: "flex", gap: "2px" }}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                width: "24px",
                height: "24px",
                padding: 0,
                backgroundColor: "transparent",
                border: "1px solid #666",
                borderRadius: "2px",
                color: "#c0c0c0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#505050")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Minus size={12} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: "24px",
                height: "24px",
                padding: 0,
                backgroundColor: "transparent",
                border: "1px solid #666",
                borderRadius: "2px",
                color: "#c0c0c0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d32f2f";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#c0c0c0";
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              padding: "16px",
              backgroundColor: "#1a1a1a",
              position: "relative",
            }}
          >
            {/* Abribus en arrière-plan */}
            <div
              style={{
                position: "absolute",
                right: "647px",
                bottom: "-5px",
                width: "98px",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 0.12,
                filter: "grayscale(1) contrast(0.8) brightness(0.9)",
              }}
            >
              <img
                src="/brand/abribus.png"
                alt=""
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>

            {/* Texte IMPORT PHOTOS */}
            <div
              style={{
                position: "absolute",
                left: "55%",
                top: "85%",
                transform: "translate(-50%, -50%)",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 0.15,
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  letterSpacing: "-1px",
                  lineHeight: "1",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                TC - ESSONNES
                <div></div>Photos de Transports
              </div>
            </div>

            {/* Content avec z-index pour être au-dessus de l'abribus */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Upload Zone */}
              {step === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? "#0ea5e9" : "#444"}`,
                    borderRadius: "6px",
                    padding: "24px",
                    textAlign: "center",
                    backgroundColor: isDragging ? "rgba(14, 165, 233, 0.1)" : "rgba(14, 165, 233, 0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Upload size={28} style={{ margin: "0 auto 8px", color: isDragging ? "#0ea5e9" : "#666" }} />
                  <div style={{ fontWeight: 500, marginBottom: "4px", color: "#d0d0d0" }}>
                    Glissez vos photos ici
                  </div>
                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>ou</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "rgba(14, 165, 233, 0.2)",
                      border: "1px solid rgba(14, 165, 233, 0.4)",
                      borderRadius: "4px",
                      color: "#0ea5e9",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.2)")}
                  >
                    Sélectionner fichiers
                  </button>
                  <div style={{ fontSize: "11px", color: "#777", marginTop: "8px" }}>
                    JPG, PNG, WebP • Max 50MB
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: "none" }}
                  />
                </div>

                {photos.length > 0 && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(14, 165, 233, 0.1)",
                      border: "1px solid rgba(14, 165, 233, 0.3)",
                      fontSize: "12px",
                      color: "#0ea5e9",
                    }}
                  >
                    ✓ {photos.length} photo{photos.length > 1 ? "s" : ""} sélectionnée{photos.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}

            {/* Edit Photos */}
            {step === "edit" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#b0b0b0" }}>
                  {photos.length} photo{photos.length > 1 ? "s" : ""} à éditer
                </div>
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(14, 165, 233, 0.05)",
                      border: "1px solid rgba(14, 165, 233, 0.2)",
                      display: "grid",
                      gridTemplateColumns: "100px 1fr",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        borderRadius: "4px",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "80px",
                      }}
                    >
                      <img
                        src={photo.preview}
                        alt={photo.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "3px", color: "#0ea5e9" }}>
                          Titre
                        </label>
                        <input
                          type="text"
                          value={photo.title}
                          onChange={(e) => updatePhoto(idx, "title", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(14, 165, 233, 0.2)",
                            color: "#e0e0e0",
                            fontSize: "12px",
                          }}
                          placeholder="Titre"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "3px", color: "#0ea5e9" }}>
                          Description
                        </label>
                        <textarea
                          value={photo.desc}
                          onChange={(e) => updatePhoto(idx, "desc", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            border: "1px solid rgba(14, 165, 233, 0.2)",
                            color: "#e0e0e0",
                            fontSize: "12px",
                            minHeight: "40px",
                            resize: "none",
                          }}
                          placeholder="Description..."
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(idx)}
                        style={{
                          fontSize: "11px",
                          color: "#ff6b6b",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === "success" && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ color: "#86efac", fontSize: "12px" }}>{message}</div>
              </div>
            )}

            {step === "error" && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ color: "#fca5a5", fontSize: "12px" }}>{message}</div>
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: "1px solid #444",
              }}
            >
              <button
                onClick={() => {
                  if (step === "edit") {
                    setStep("upload");
                  } else {
                    onClose();
                  }
                }}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#b0b0b0",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  opacity: isSaving ? 0.5 : 1,
                }}
                onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
              >
                {step === "edit" ? "← Retour" : "Fermer"}
              </button>

              {step === "upload" && photos.length > 0 && (
                <button
                  onClick={() => setStep("edit")}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(14, 165, 233, 0.25)",
                    border: "1px solid rgba(14, 165, 233, 0.4)",
                    color: "#0ea5e9",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.25)")}
                >
                  Suivant →
                </button>
              )}

              {step === "edit" && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(34, 197, 94, 0.25)",
                    border: "1px solid rgba(34, 197, 94, 0.4)",
                    color: "#22c55e",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.25)")}
                >
                  {isSaving ? (
                    <>
                      <Loader size={12} style={{ animation: "spin 1s linear infinite" }} />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save size={12} />
                      Sauvegarder
                    </>
                  )}
                </button>
              )}

              {(step === "success" || step === "error") && (
                <button
                  onClick={() => {
                    setStep("upload");
                    setMessage("");
                    setPhotos([]);
                    if (step === "success") onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(14, 165, 233, 0.25)",
                    border: "1px solid rgba(14, 165, 233, 0.4)",
                    color: "#0ea5e9",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(14, 165, 233, 0.25)")}
                >
                  {step === "success" ? "Fermer" : "Réessayer"}
                </button>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
