"use client";

import { useState } from "react";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";

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
      const token = prompt(
        "Entrez le token admin (ADMIN_TOKEN):",
        ""
      )?.trim();
      if (!token) {
        setStatus("error");
        setMessage("Token requis");
        setIsImporting(false);
        return;
      }

      const response = await fetch("/api/admin/import-photos", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(
          `✅ ${data.imported} photos importées (${data.skipped} doublons ignorés)`
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Importer les photos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-4">
            Cet outil importera toutes les photos des dossiers JSON vers la base de données PostgreSQL.
          </p>
          <p className="text-gray-700 text-sm font-semibold mb-2">
            ⚠️ Important:
          </p>
          <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
            <li>Les photos déjà en DB seront ignorées</li>
            <li>Les métadonnées (titre, description) seront préservées</li>
            <li>Cela peut prendre quelques secondes</li>
          </ul>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-green-700">{message}</p>
              {details && (
                <details className="mt-2 cursor-pointer text-gray-600 text-xs">
                  <summary>Voir les détails</summary>
                  <pre className="mt-2 bg-white p-2 rounded border border-green-200 overflow-auto max-h-48 text-xs">
                    {JSON.stringify(details, null, 2)}
                  </pre>
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
            disabled={isImporting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition font-medium text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {isImporting ? "Import en cours..." : "Importer"}
          </button>
        </div>
      </div>
    </div>
  );
}
