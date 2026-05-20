import type { Category, Shop, Product, Rental, Paginated } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

async function upload(file: File): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Upload failed");
  return data.url;
}

async function uploadMultiple(files: File[]): Promise<string[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${API_BASE}/upload/multiple`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || "Upload failed");
  return (data as { url: string }[]).map((d) => d.url);
}

export const api = {
  upload,
  uploadMultiple,

  auth: {
    register: (body: object) =>
      fetcher<{ accessToken: string; user: import("./types").User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: object) =>
      fetcher<{ accessToken: string; user: import("./types").User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    logout: () => fetcher<void>("/auth/logout", { method: "POST" }),
  },

  categories: {
    list: () => fetcher<Category[]>("/categories"),
  },

  products: {
    list: (params?: Record<string, string | number | undefined>) => {
      const cleaned = Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "")
      ) as Record<string, string>;
      const query = new URLSearchParams(cleaned).toString();
      return fetcher<Paginated<Product>>(`/products?${query}`);
    },
    get: (id: string) => fetcher<Product>(`/products/${id}`),
    availability: (id: string, month?: string) =>
      fetcher<{ date: string; isBooked: boolean }[]>(
        `/products/${id}/availability${month ? `?month=${month}` : ""}`
      ),
    create: (body: object) =>
      fetcher<Product>("/products", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: object) =>
      fetcher<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) =>
      fetcher<void>(`/products/${id}`, { method: "DELETE" }),
    contact: (id: string, source?: string) =>
      fetcher<{ lineId: string }>(`/products/${id}/contact?source=${source ?? "product_detail"}`, {
        method: "POST",
      }),
  },

  shops: {
    list: (params?: Record<string, string | number | undefined>) => {
      const cleaned = Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "")
      ) as Record<string, string>;
      const query = new URLSearchParams(cleaned).toString();
      return fetcher<Paginated<Shop>>(`/shops?${query}`);
    },
    get: (id: string) => fetcher<Shop & { products: Product[] }>(`/shops/${id}`),
    my: () => fetcher<Shop & { products: Product[]; rentals: Rental[] }>("/shops/my"),
    create: (body: object) =>
      fetcher<Shop>("/shops", { method: "POST", body: JSON.stringify(body) }),
    update: (body: object) =>
      fetcher<Shop>("/shops/my", { method: "PATCH", body: JSON.stringify(body) }),
  },

  rentals: {
    create: (body: object) =>
      fetcher<Rental>("/rentals", { method: "POST", body: JSON.stringify(body) }),
    my: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return fetcher<Paginated<Rental>>(`/rentals/my?${query}`);
    },
    shop: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return fetcher<Paginated<Rental>>(`/rentals/shop?${query}`);
    },
    updateStatus: (id: string, status: string) =>
      fetcher<Rental>(`/rentals/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string) => fetcher<Rental>(`/rentals/${id}`, { method: "DELETE" }),
  },
};
