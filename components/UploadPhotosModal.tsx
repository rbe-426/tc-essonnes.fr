"use client";

import { useState } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader, Image } from "lucide-react";

interface UploadPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  networkSlug: string;
  folder: string;
}

export default function UploadPhotosModal({
  isOpen,
  onClose,
  onUploadComplete,
  networkSlug,
  folder,
}: UploadPhotosModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus("error");
      setMessage("Veuillez sélectionner des photos");
      return;
    }

    setIsUploading(true);
    setStatus("idle");
    setMessage("");
    setDetails(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", folder);
      formData.append("networkSlug", networkSlug);

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(`✅ ${data.photos.length} photo(s) sauvegardée(s) en base de données`);
        setDetails(data.photos);
        setFiles([]);
        onUploadComplete?.();
      } else {
        setStatus("error");
        setMessage(data.message || "Erreur lors de l'upload");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setStatus("idle");
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Image className="text-orange-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ajouter des photos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        {status === "idle" && (
          <div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Sélectionnez vos photos. Elles seront compressées en WebP et sauvegardées directement dans la base de données.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition duration-200"
            >
              <div className="flex justify-center mb-3">
                <Upload className="text-orange-400" size={40} strokeWidth={1.5} />
              </div>
              <p className="text-gray-700 text-sm font-semibold mb-1">
                Glissez-déposez vos photos ici
              </p>
              <p className="text-gray-400 text-xs mb-3">JPG, PNG, WebP, GIF</p>
              <label className="inline-block">
                <span className="text-orange-600 hover:text-orange-700 text-sm font-semibold cursor-pointer hover:underline">
                  ou parcourez votre ordinateur
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={clearFiles}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Effacer
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-400 flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="text-sm font-semibold text-green-800">{message}</p>
                {details && (
                  <details className="mt-3 cursor-pointer">
                    <summary className="text-xs text-green-700 hover:text-green-900 font-medium">
                      Voir les photos importées
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {details.map((photo: any, i: number) => (
                        <div key={i} className="text-xs text-gray-600 bg-white p-2 rounded border border-green-100 truncate">
                          {photo.title}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="text-sm font-semibold text-red-800">{message}</p>
              {files.length > 0 && (
                <button
                  onClick={clearFiles}
                  className="text-xs text-red-600 hover:text-red-700 mt-2 hover:underline font-medium"
                >
                  Réessayer avec d'autres fichiers
                </button>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Upload size={18} />
                Télécharger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
