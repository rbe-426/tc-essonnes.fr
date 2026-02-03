import { getLatestPhotos } from "@/lib/getLatestPhotos";

// Fonction pour calculer le seed basé sur la semaine (dimanche 18h UTC)
function getWeekSeed(): number {
  const now = new Date();
  
  // Convertir en UTC
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  // Trouver le dernier dimanche à 18h UTC
  const daysToLastSunday = (utcDate.getUTCDay() || 7) - 7; // 0 = dimanche
  const lastSunday = new Date(utcDate);
  lastSunday.setUTCDate(utcDate.getUTCDate() + daysToLastSunday);
  lastSunday.setUTCHours(18, 0, 0, 0);
  
  // Si on n'a pas atteint 18h dimanche cette semaine, prendre le dimanche d'avant
  if (utcDate < lastSunday) {
    lastSunday.setUTCDate(lastSunday.getUTCDate() - 7);
  }
  
  // Retourner le timestamp comme seed
  return Math.floor(lastSunday.getTime() / 1000);
}

// Fonction simple pour générer un nombre pseudo-aléatoire déterministe
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function GET() {
  try {
    const latest = await getLatestPhotos(100);
    if (latest.length === 0) {
      return Response.json({ photo: null });
    }
    
    // Utiliser le seed basé sur la semaine
    const seed = getWeekSeed();
    const randomIndex = Math.floor(seededRandom(seed) * latest.length);
    const photoOfWeek = latest[randomIndex];
    
    return Response.json({ photo: photoOfWeek });
  } catch (error) {
    console.error("Error fetching weekly photo:", error);
    return Response.json({ photo: null }, { status: 500 });
  }
}
