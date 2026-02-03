import { getLatestPhotos } from "@/lib/getLatestPhotos";

// Fonction pour calculer le seed basé sur la semaine (dimanche 18h UTC)
// Retourne toujours la même valeur pour la même semaine, peu importe le timezone
function getWeekSeed(): number {
  const now = new Date();
  
  // Obtenir directement le timestamp UTC
  const utcTime = now.getTime();
  
  // Calculer le nombre de millisecondes depuis le dernier dimanche 18h UTC
  // Dimanche = jour 0, donc on cherche le dernier jour 0 à 18h
  const msPerDay = 24 * 60 * 60 * 1000;
  const msPerWeek = 7 * msPerDay;
  
  // Référence: dimanche 1970-01-04 à 18h UTC (timestamp = 345600000)
  const referenceTime = new Date("1970-01-04T18:00:00Z").getTime();
  
  // Combien de semaines complètes depuis la référence?
  const weeksSinceReference = Math.floor((utcTime - referenceTime) / msPerWeek);
  
  // Timestamp du dernier dimanche 18h UTC
  const lastSundayAtSix = referenceTime + weeksSinceReference * msPerWeek;
  
  // Retourner comme seed (en secondes pour compatibilité)
  return Math.floor(lastSundayAtSix / 1000);
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
