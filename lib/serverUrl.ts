// lib/serverUrl.ts
export function getServerUrl(): string {
  // Utiliser l'URL depuis l'environnement si disponible
  if (typeof window !== "undefined") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
    
    // Fallback: si localhost et pas de NEXT_PUBLIC_API_URL, utiliser local
    if (window.location.hostname === "localhost") {
      return "http://localhost:3001";
    }
  }

  // Default production - ajuster l'URL à votre domaine Railway réel
  return "https://innovative-serenity-rbe-serveurs.up.railway.app";
}
