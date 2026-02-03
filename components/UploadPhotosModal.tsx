"use client";

import { useState } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";

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
        setMessage(`✅ ${data.photos.length} photo(s) téléchargée(s) et sauvegardée(s) en DB`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ajouter des photos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {status === "idle" && (
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              Glissez-déposez des photos ou cliquez pour sélectionner. Elles seront compressées en WebP et sauvegardées directement dans la base de données.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600 text-sm font-medium">
                Glissez-déposez les photos ici
              </p>
              <p className="text-gray-400 text-xs mt-1">ou</p>
              <label className="inline-block mt-2">
                <span className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
                  Parcourir les fichiers
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
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {files.length} fichier(s) sélectionné(s):
                </p>
                <div className="bg-gray-50 rounded p-3 max-h-32 overflow-auto">
                  <ul className="text-xs text-gray-600 space-y-1">
                    {files.map((file, i) => (
                      <li key={i} className="truncate">
                        • {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-green-700">{message}</p>
              {details && (
                <details className="mt-2 cursor-pointer text-gray-600 text-xs">
                  <summary>Voir les photos importées</summary>
                  <div className="mt-2 bg-white p-2 rounded border border-green-200 max-h-48 overflow-auto text-xs">
                    {details.map((photo: any, i: number) => (
                      <div key={i} className="truncate text-gray-600">
                        {photo.title}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm font-semibold text-red-700">{message}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-medium text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload size={16} />
                Télécharger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
