const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function fetcher(path: string, options?: RequestInit) {
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
  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  auth: {
    register: (body: any) => fetcher("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: any) => fetcher("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  },
  categories: {
    list: () => fetcher("/categories"),
  },
  products: {
    list: (params?: { categoryId?: string; shopId?: string; q?: string }) => {
      const query = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
      return fetcher(`/products?${query}`);
    },
    get: (id: string) => fetcher(`/products/${id}`),
    availability: (id: string, month?: string) => {
      const q = month ? `?month=${month}` : "";
      return fetcher(`/products/${id}/availability${q}`);
    },
  },
  shops: {
    list: () => fetcher("/shops"),
    get: (id: string) => fetcher(`/shops/${id}`),
    my: () => fetcher("/shops/my"),
  },
  rentals: {
    create: (body: any) => fetcher("/rentals", { method: "POST", body: JSON.stringify(body) }),
    my: () => fetcher("/rentals/my"),
    shop: () => fetcher("/rentals/shop"),
  },
};
