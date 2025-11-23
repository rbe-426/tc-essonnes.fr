// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://innovative-serenity-rbe-serveurs.up.railway.app";

export const api = {
  baseURL: API_BASE_URL,

  async request(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const headers: any = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur API");
    }

    return response.json();
  },

  // Auth
  auth: {
    login: (username: string, password: string) =>
      api.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),

    getMe: () => api.request("/api/auth/me"),

    logout: () => api.request("/api/auth/logout", { method: "POST" }),
  },

  // Networks
  networks: {
    getAll: () => api.request("/api/networks"),

    getBySlug: (slug: string) => api.request(`/api/networks/${slug}`),

    create: (data: any) =>
      api.request("/api/networks", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (slug: string, data: any) =>
      api.request(`/api/networks/${slug}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Photos
  photos: {
    getByNetwork: (networkSlug: string) =>
      api.request(`/api/photos/${networkSlug}`),

    getOne: (networkSlug: string, photoId: string) =>
      api.request(`/api/photos/${networkSlug}/${photoId}`),

    create: (networkSlug: string, data: any) =>
      api.request(`/api/photos/${networkSlug}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (networkSlug: string, photoId: string, data: any) =>
      api.request(`/api/photos/${networkSlug}/${photoId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (networkSlug: string, photoId: string) =>
      api.request(`/api/photos/${networkSlug}/${photoId}`, {
        method: "DELETE",
      }),
  },
};
