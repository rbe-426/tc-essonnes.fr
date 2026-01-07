// lib/serverUrl.ts
export function getServerUrl(): string {
  // En développement (localhost)
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001"; // Serveur local
  }

  // En production, utiliser le serveur Railway
  return "https://innovative-serenity-rbe-serveurs.up.railway.app:8081";
}
