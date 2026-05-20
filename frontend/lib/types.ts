export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  lineId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  address?: string;
  district?: string;
  phone?: string;
  lineId?: string;
  instagram?: string;
  qrCodeUrl?: string;
  openingHours?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  ownerId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  pricePerDay: number;
  deposit?: number;
  brand?: string;
  size?: string;
  color?: string;
  occasion?: string;
  tags: string[];
  condition?: string;
  status: "AVAILABLE" | "RESERVED" | "UNAVAILABLE" | "ARCHIVED";
  shopId: string;
  categoryId: string;
  shop?: Pick<Shop, "id" | "name" | "logo" | "lineId" | "phone" | "district">;
  category?: Category;
  createdAt: string;
}

export interface Rental {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
  product?: Pick<Product, "id" | "name" | "images">;
  shop?: Pick<Shop, "id" | "name">;
  renter?: Pick<User, "id" | "firstName" | "lastName" | "phone">;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
