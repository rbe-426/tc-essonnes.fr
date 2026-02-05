// lib/serverUrlServer.ts - Version serveur de getServerUrl
export function getServerUrl(): string {
  // Priorité 1: Variable env BACKEND_URL
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  
  // Priorité 2: Variable env NEXT_PUBLIC_API_URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Dev default
  return "http://localhost:3001";
}
