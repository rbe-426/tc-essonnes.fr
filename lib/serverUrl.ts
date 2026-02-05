// lib/serverUrl.ts
export function getServerUrl(): string {
  // Utiliser l'URL depuis l'environnement si disponible
  if (typeof window !== "undefined") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log("🔍 [serverUrl] NEXT_PUBLIC_API_URL =", apiUrl);
    if (apiUrl) {
      console.log("✅ [serverUrl] Utilisant NEXT_PUBLIC_API_URL:", apiUrl);
      return apiUrl;
    }
    
    // Fallback: si localhost et pas de NEXT_PUBLIC_API_URL, utiliser local
    if (window.location.hostname === "localhost") {
      console.log("✅ [serverUrl] Mode localhost détecté, utilisant http://localhost:3001");
      return "http://localhost:3001";
    }
  }

  // Production - Railway expose sur le port 8081
  console.log("✅ [serverUrl] Mode production, utilisant Railway port 8081");
  return "https://innovative-serenity-rbe-serveurs.up.railway.app:8081";
}
