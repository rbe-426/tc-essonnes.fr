"use client";

import { useEffect, useState } from "react";
import LatestAdditions from "./LatestAdditions";
import type { LatestItem } from "@/lib/getLatestPhotos";

interface LatestAdditionsWrapperProps {
  initialItems: LatestItem[];
  initial?: number;
}

export default function LatestAdditionsWrapper({ initialItems, initial = 5 }: LatestAdditionsWrapperProps) {
  useEffect(() => {
    // Recharger les derniers arrivages quand des modifications sont détectées
    const handlePhotosUpdated = () => {
      // Recharger la page pour récupérer les nouveaux derniers arrivages
      window.location.reload();
    };

    // Listener sur custom event
    window.addEventListener("photos-updated", handlePhotosUpdated);

    return () => {
      window.removeEventListener("photos-updated", handlePhotosUpdated);
    };
  }, []);

  return <LatestAdditions items={initialItems} initial={initial} />;
}
