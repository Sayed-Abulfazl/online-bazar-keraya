/** Shared application types. Keep these contracts aligned with the existing API responses. */
export type UserRole = "user" | "owner" | "admin";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "received"
  | "paid";
export type IdLike = string | { toString(): string };

export interface UserSummary {
  id?: string;
  _id?: IdLike;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  address?: string;
}

export interface ShopSummary {
  id?: string;
  _id?: IdLike;
  name: string;
  address?: string;
  phone?: string;
  image?: string;
  ownerId?: string;
  owner?: IdLike | { _id?: IdLike; name?: string; email?: string };
}

export interface ItemSummary {
  id?: string;
  _id?: IdLike;
  name: string;
  description?: string;
  image: string;
  priceDaily: number;
  shop?: IdLike | ShopSummary | null;
  shopId?: string;
  ownerId?: string;
}

export interface CartLine {
  id: string;
  quantity: number;
  days: number;
  selected: boolean;
}

export interface OrderLineRecord {
  item: IdLike;
  name: string;
  image?: string;
  priceDaily: number;
  quantity?: number;
  days?: number;
}

export interface PopulatedShopRecord {
  _id: IdLike;
  name: string;
  phone?: string;
  address?: string;
  image?: string;
  owner?: IdLike;
}

export interface PopulatedUserRecord {
  _id: IdLike;
  name?: string;
  email?: string;
  phone?: string;
}

export interface LeanOrderRecord {
  _id: IdLike;
  items: OrderLineRecord[];
  status: OrderStatus;
  rating?: number | null;
  hiddenByCustomer?: boolean | IdLike[];
  hiddenByOwner?: boolean | IdLike[];
  shop?: PopulatedShopRecord | null;
  customer?: PopulatedUserRecord | null;
  owner?: PopulatedUserRecord | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  createdAt: Date;
}

export interface LeanItemRecord {
  _id: IdLike;
  name: string;
  description?: string;
  image: string;
  priceDaily: number;
  shop?: PopulatedShopRecord | null;
  owner?: PopulatedUserRecord | null;
}

export interface LeanShopRecord {
  _id: IdLike;
  active?: boolean;
  name: string;
  description?: string;
  address: string;
  image: string;
  owner?: PopulatedUserRecord | null;
}

export interface LeanUserRecord {
  _id: IdLike;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  address?: string;
  createdAt: Date;
}

export interface LeanAdminRecord {
  _id: IdLike;
  name: string;
  active: boolean;
  createdAt: Date;
}

export interface LeanMessageRecord {
  _id: IdLike;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read";
  createdAt: Date;
}

export interface AdminUserDetailResponse {
  success: boolean;
  user: UserSummary & { createdAt: string | Date };
  shops: Array<{
    _id: string;
    name: string;
    phone: string;
    address: string;
    image?: string;
    createdAt?: string | Date;
  }>;
  items: Array<{
    _id: string;
    name: string;
    image: string;
    priceDaily: number;
    shop?: { name?: string } | null;
    createdAt?: string | Date;
  }>;
}
