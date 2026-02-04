"use client";

import { useState } from "react";
import { X, Upload, CheckCircle, AlertCircle, Loader, FileJson } from "lucide-react";

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
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setStatus("idle");
    setMessage("");
    setDetails(null);

    try {
      // En production, un token est requis (géré par le backend)
      // En dev, pas besoin
      const token = process.env.NODE_ENV === "production" 
        ? prompt("Entrez le token admin (ADMIN_TOKEN):", "")?.trim()
        : "";

      if (process.env.NODE_ENV === "production" && !token) {
        setStatus("error");
        setMessage("Token requis");
        setIsImporting(false);
        return;
      }

      const headers: any = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/admin/import-photos", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(
          `${data.imported} photo(s) importée(s) — ${data.skipped} doublon(s) ignoré(s)`
        );
        setDetails(data.details);
        onImportComplete?.();
      } else {
        setStatus("error");
        setMessage(data.message || "Erreur lors de l'import");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    } finally {
      setIsImporting(false);
    }
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileJson className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Importer depuis JSON</h2>
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
              Cet outil importera toutes les photos depuis les fichiers <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">photos.json</code> vers la base de données PostgreSQL.
            </p>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold">À noter:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Les photos déjà en DB seront ignorées</li>
                  <li>Les métadonnées seront préservées</li>
                  <li>Cela peut prendre quelques secondes</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status === "success" && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="text-sm font-semibold text-green-800">{message}</p>
                {details && (
                  <details className="mt-3 cursor-pointer">
                    <summary className="text-xs text-green-700 hover:text-green-900 font-medium">
                      Voir les détails
                    </summary>
                    <div className="mt-2 space-y-2">
                      {details.imported && details.imported.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Importées:</p>
                          <div className="bg-white p-2 rounded border border-green-200 max-h-32 overflow-auto">
                            {details.imported.slice(0, 10).map((item: string, i: number) => (
                              <div key={i} className="text-xs text-gray-600 truncate">
                                ✓ {item}
                              </div>
                            ))}
                            {details.imported.length > 10 && (
                              <div className="text-xs text-gray-500 italic mt-1">
                                +{details.imported.length - 10} autres...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {details.skipped && details.skipped.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Ignorées:</p>
                          <div className="bg-gray-50 p-2 rounded border border-gray-200 max-h-32 overflow-auto">
                            {details.skipped.slice(0, 5).map((item: string, i: number) => (
                              <div key={i} className="text-xs text-gray-600 truncate">
                                ⊘ {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader size={18} className="animate-spin" />
                Importation...
              </>
            ) : (
              <>
                <Upload size={18} />
                Importer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
