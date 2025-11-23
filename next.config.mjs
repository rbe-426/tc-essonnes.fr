/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignorer les erreurs du répertoire server
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    // Ignorer les fichiers du serveur
    ignoreDuringBuilds: false,
  },
};
export default nextConfig;
