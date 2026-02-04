"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface EditContextType {
  isEditMode: boolean;
  isAuthenticated: boolean;
  isLocalhost: boolean;
  setIsEditMode: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Détecte si on est en localhost
    const isLocal = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    
    console.log("🔍 Détection EditContext:", { isLocal, hostname: window.location.hostname });
    
    setIsLocalhost(isLocal);
    
    // Vérifier le cookie admin (déverrouillage temporaire)
    const cookies = typeof document !== "undefined" ? document.cookie : "";
    const hasAdminCookie = cookies.includes("admin-edit-mode=true");
    
    // Si en localhost, active automatiquement le mode édition et l'authentification
    if (isLocal || hasAdminCookie) {
      setIsAuthenticated(true);
      setIsEditMode(true);
      console.log("✅ Mode édition activé (localhost ou admin-unlock)");
    }
  }, []);

  const logout = () => {
    setIsEditMode(false);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
  };

  return (
    <EditContext.Provider
      value={{
        isEditMode,
        isAuthenticated,
        isLocalhost,
        setIsEditMode,
        setIsAuthenticated,
        logout,
      }}
    >
      {children}
    </EditContext.Provider>
  );
}

export function useEditContext() {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error("useEditContext doit être utilisé dans EditProvider");
  }
  return context;
}
