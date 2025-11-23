// lib/weeklyPhoto.ts
import { api } from "./api";

export interface WeeklyPhoto {
  src: string;
  title: string;
  href: string;
  credit?: string;
  folder: string;
}

/**
 * Génère un seed déterministe basé sur le numéro de semaine
 * Même semaine = même seed = même photo
 */
function getWeekNumber(d = new Date()): number {
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Retourne une photo aléatoire basée sur le numéro de semaine
 * Même semaine = toujours la même photo
 */
export function pickWeeklyPhoto(photos: WeeklyPhoto[], d = new Date()): WeeklyPhoto | null {
  if (!photos || photos.length === 0) return null;
  
  const weekNumber = getWeekNumber(d);
  const index = weekNumber % photos.length;
  return photos[index];
}

/**
 * Récupère toutes les photos disponibles des réseaux via l'API
 */
export async function getAllNetworkPhotos(): Promise<WeeklyPhoto[]> {
  try {
    // Récupérer tous les réseaux
    const networksData = await api.networks.getAll();
    const networks = networksData.networks;

    const allPhotos: WeeklyPhoto[] = [];

    // Pour chaque réseau, récupérer les photos
    for (const network of networks) {
      try {
        const photosData = await api.photos.getByNetwork(network.slug);
        const photos = photosData.photos;

        if (Array.isArray(photos)) {
          for (const photo of photos) {
            allPhotos.push({
              src: photo.img,
              title: photo.title,
              href: `/gallery/network/${network.slug}`,
              credit: photo.desc || undefined,
              folder: network.slug,
            });
          }
        }
      } catch (error) {
        console.warn(`Erreur lors du chargement des photos de ${network.slug}:`, error);
      }
    }

    return allPhotos;
  } catch (error) {
    console.error("Erreur lors de la récupération des photos:", error);
    return [];
  }
}
