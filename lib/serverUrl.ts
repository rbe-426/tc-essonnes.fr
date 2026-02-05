// lib/serverUrl.ts
export function getServerUrl(): string {
  // Utiliser l'URL depuis l'environnement si disponible
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== "undefined") {
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
    
    // Production: utiliser même domaine (pas de port hardcodé)
    const protocol = window.location.protocol;
    const host = window.location.host;
    // Utiliser le même domaine, le backend est sur le même service Railway
    console.log("✅ [serverUrl] Mode production, utilisant même domaine:", `${protocol}//${host}`);
    return `${protocol}//${host}`;
  }

  // SSR: retourner l'URL depuis env ou fallback
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback SSR (sans port)
  return "https://innovative-serenity-rbe-serveurs.up.railway.app";
}
