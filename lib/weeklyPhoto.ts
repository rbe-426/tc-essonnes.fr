// lib/weeklyPhoto.ts
import { readFile } from "fs/promises";
import { join } from "path";

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
 * Récupère toutes les photos disponibles des réseaux (côté serveur)
 */
export async function getAllNetworkPhotos(): Promise<WeeklyPhoto[]> {
  try {
    const networks = [
      { slug: "tisse", folder: "tisse" },
      { slug: "transdev-coeur-essonne", folder: "transdev-coeur-essonne" },
      { slug: "transdev-senart", folder: "transdev-senart" },
      { slug: "retrobus-essonne", folder: "retrobus-essonne" },
      { slug: "rer", folder: "rer" },
      { slug: "ratp", folder: "ratp" },
      { slug: "ratp_cap_saclay", folder: "ratp_cap_saclay" },
      { slug: "kvyvs", folder: "kvyvs" },
      { slug: "nav_rerd", folder: "nav_rerd" },
      { slug: "reseau-ksvm", folder: "reseau-ksvm" },
      { slug: "cars-soeur", folder: "cars-soeur" },
    ];

    const allPhotos: WeeklyPhoto[] = [];

    for (const network of networks) {
      try {
        const photosPath = join(
          process.cwd(),
          "public",
          "photos",
          network.folder,
          "photos.json"
        );

        const fileContent = await readFile(photosPath, "utf-8");
        const photos = JSON.parse(fileContent);

        if (Array.isArray(photos)) {
          for (const photo of photos) {
            allPhotos.push({
              src: photo.img,
              title: photo.title,
              href: `/gallery/network/${network.slug}`,
              credit: photo.desc || undefined,
              folder: network.folder,
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
