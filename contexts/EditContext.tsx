"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface EditContextType {
  isEditMode: boolean;
  isAuthenticated: boolean;
  setIsEditMode: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
