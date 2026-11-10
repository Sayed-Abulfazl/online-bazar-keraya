"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  Store,
  Package,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Clock3,
  Wallet,
  Eye,
  Bell,
  LogOut,
  UserPlus,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { AdminRouteAccess } from "@/components/RouteAccess";
import { SHOP_LABEL, SHOP_LABEL_PLURAL } from "@/constants";

type AdminSession = { id: string; name: string; role: "master" | "admin" };
type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "owner";
  profileImage: string;
  createdAt: string;
};
type Stats = {
  customers: number;
  owners: number;
  shops: number;
  items: number;
};
type ContentRow = {
  id: string;
  name: string;
  description?: string;
  image: string;
  owner: string;
  ownerId?: string;
  active?: boolean;
  address?: string;
  priceDaily?: number;
  shop?: string;
};
type MessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read";
  createdAt: string;
};
type OrderRow = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "received" | "paid";
  createdAt: string;
  shop: string;
  shopAddress: string;
  customerAddress: string;
  customer: string;
  customerEmail: string;
  owner: string;
  items: { name: string; quantity: number; days: number }[];
  totalAmount: number;
};
type Report = {
  totalOrders: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  paidCount: number;
  paidAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
};
type AdminRow = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
};
type Tab =
  | "users"
  | "shops"
  | "pendingShops"
  | "items"
  | "orders"
  | "messages"
  | "admins";
const createAdminSchema = z.object({
  name: z.string().trim().min(2, "نام مدیر حداقل ۲ حرف باشد.").max(80),
  password: z.string().min(8, "رمز عبور حداقل ۸ حرف باشد.").max(100),
});

function AdminPageContent() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [shops, setShops] = useState<ContentRow[]>([]);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [tab, setTab] = useState<Tab>("users");
  const [filter, setFilter] = useState<"all" | "user" | "owner">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminFormErrors, setAdminFormErrors] = useState<{
    name?: string;
    password?: string;
  }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sessionResponse = await axios.get("/api/admin-auth/me");
      const currentAdmin = sessionResponse.data.admin as AdminSession | null;
      if (!currentAdmin) {
        router.replace("/admin-login");
        return;
      }
      setAdmin(currentAdmin);
      const [userResponse, contentResponse, messageResponse, orderResponse] =
        await Promise.all([
          axios.get("/api/admin/users"),
          axios.get("/api/admin/content"),
          axios.get("/api/admin/messages"),
          axios.get("/api/admin/orders"),
        ]);
      setUsers(userResponse.data.users || []);
      setStats(userResponse.data.stats || null);
      setShops(contentResponse.data.shops || []);
      setItems(contentResponse.data.items || []);
      setMessages(messageResponse.data.messages || []);
      setOrders(orderResponse.data.orders || []);
      setReport(orderResponse.data.report || null);
      if (currentAdmin.role === "master") {
        const adminResponse = await axios.get("/api/admin/admins");
        setAdmins(adminResponse.data.admins || []);
      } else {
        setAdmins([]);
        if (tab === "admins") setTab("orders");
      }
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "دریافت گزارش‌ها انجام نشد."
          : "خطا در دریافت گزارش‌ها.",
      );
      if (
        axios.isAxiosError(error) &&
        [401, 403].includes(error.response?.status || 0)
      )
        router.replace("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router, tab]);

  useEffect(() => {
    const loadMethod = () => {
      void load();
    }
    loadMethod();
  }, [load]);

  async function logout() {
    try {
      await axios.post("/api/admin-auth/logout");
      toast.success("از پنل مدیر خارج شدید.");
      router.replace("/admin-login");
      router.refresh();
    } catch {
      toast.error("خروج انجام نشد.");
    }
  }

  async function remove(
    kind: "users" | "shops" | "pendingShops" | "items",
    id: string,
    name: string,
  ) {
    if (admin?.role !== "master") {
      toast.error("فقط مدیر کل اجازه حذف دارد.");
      return;
    }
    if (!window.confirm(`آیا مطمئن هستید «${name}» حذف شود؟`)) return;
    setBusy(id);
    try {
      const url =
        kind === "users"
          ? `/api/admin/users/${id}`
          : kind === "shops"
            ? `/api/admin/shops/${id}`
            : `/api/admin/items/${id}`;
      const response = await axios.delete(url);
      toast.success(response.data.message || "حذف شد.");
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "حذف انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function moderateShop(
    id: string,
    action: "approve" | "reject" | "deactivate",
  ) {
    if (admin?.role !== "master") return;
    setBusy(id);
    try {
      const response =
        action === "reject"
          ? await axios.patch(`/api/admin/shops/${id}`, { reject: true })
          : await axios.patch(`/api/admin/shops/${id}`, {
              active: action === "approve",
            });
      toast.success(response.data.message || "وضعیت فروشگاه تغییر کرد.");
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "عملیات انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function changeMessage(id: string, status: "read") {
    if (admin?.role !== "master") {
      toast.error("فقط مدیر کل می‌تواند وضعیت پیام را تغییر دهد.");
      return;
    }
    setBusy(id);
    try {
      const response = await axios.patch("/api/admin/messages", { id, status });
      toast.success(response.data.message || "وضعیت پیام تغییر کرد.");
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "تغییر پیام انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteMessage(id: string) {
    if (admin?.role !== "master") return;
    if (!window.confirm("این پیام حذف شود؟")) return;
    setBusy(id);
    try {
      const response = await axios.delete("/api/admin/messages", {
        data: { id },
      });
      toast.success(response.data.message || "پیام حذف شد.");
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "حذف پیام انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = createAdminSchema.safeParse({
      name: newName,
      password: newPassword,
    });
    if (!checked.success) {
      const next: { name?: string; password?: string } = {};
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if ((key === "name" || key === "password") && !next[key])
          next[key] = issue.message;
      });
      setAdminFormErrors(next);
      return;
    }
    setAdminFormErrors({});
    setBusy("create-admin");
    try {
      const response = await axios.post("/api/admin/admins", checked.data);
      toast.success(response.data.message || "مدیر ساخته شد.");
      setNewName("");
      setNewPassword("");
      setAdminFormErrors({});
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "ساخت مدیر انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function toggleAdmin(item: AdminRow) {
    if (admin?.role !== "master") return;
    setBusy(item.id);
    try {
      const response = await axios.patch(`/api/admin/admins/${item.id}`, {
        active: !item.active,
      });
      toast.success(response.data.message);
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "تغییر وضعیت مدیر انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteAdmin(id: string, name: string) {
    if (admin?.role !== "master") return;
    if (!window.confirm(`مدیر «${name}» حذف شود؟`)) return;
    setBusy(id);
    try {
      const response = await axios.delete(`/api/admin/admins/${id}`);
      toast.success(response.data.message || "مدیر حذف شد.");
      await load();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "حذف مدیر انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }

  const query = search.trim().toLocaleLowerCase();
  const shownUsers = users.filter(
    (user) =>
      (filter === "all" || user.role === filter) &&
      (!query ||
        `${user.name} ${user.email} ${user.phone}`
          .toLocaleLowerCase()
          .includes(query)),
  );
  const shownShops = shops.filter(
    (item) =>
      !query ||
      `${item.name} ${item.description || ""} ${item.address || ""} ${item.owner}`
        .toLocaleLowerCase()
        .includes(query),
  );
  const shownItems = items.filter(
    (item) =>
      !query ||
      `${item.name} ${item.description || ""} ${item.shop || ""} ${item.owner}`
        .toLocaleLowerCase()
        .includes(query),
  );
  const shownMessages = messages.filter(
    (message) =>
      !query ||
      `${message.name} ${message.email} ${message.subject} ${message.message}`
        .toLocaleLowerCase()
        .includes(query),
  );
  const shownOrders = orders.filter(
    (order) =>
      !query ||
      `${order.shop} ${order.shopAddress} ${order.customerAddress} ${order.customer} ${order.customerEmail} ${order.owner} ${order.status} ${order.items.map((item) => item.name).join(" ")}`
        .toLocaleLowerCase()
        .includes(query),
  );
  const unreadCount = messages.filter(
    (message) => message.status === "new",
  ).length;
  const money = (amount: number) =>
    `${Number(amount || 0).toLocaleString("fa-AF")} افغانی`;

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: "users", label: "کاربران", icon: <Users size={17} /> },
    { key: "shops", label: "فروشگاه‌ها", icon: <Store size={17} /> },
    ...(admin?.role === "master"
      ? [
          {
            key: "pendingShops" as const,
            label: "دکان‌های در انتظار تأیید",
            icon: <Clock3 size={17} />,
          },
        ]
      : []),
    { key: "items", label: "اجناس", icon: <Package size={17} /> },
    { key: "orders", label: "گزارش سفارش‌ها", icon: <Wallet size={17} /> },
    {
      key: "messages",
      label: `پیام‌ها${unreadCount ? ` (${unreadCount} خوانده‌نشده)` : ""}`,
      icon: <Bell size={17} />,
    },
    ...(admin?.role === "master"
      ? [
          {
            key: "admins" as const,
            label: "مدیران",
            icon: <ShieldCheck size={17} />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={23} />
            </span>
            <div>
              <h1 className="text-xl font-bold">پنل مدیریت</h1>
              <p className="text-xs text-slate-500">
                {admin?.role === "master"
                  ? "مدیر کل · دسترسی کامل"
                  : "مدیر عادی · فقط مشاهده گزارش‌ها"}
                {admin ? ` — ${admin.name}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              مشاهده سایت
            </Link>
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            >
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-blue-700">مرکز نظارت</p>
            <h2 className="mt-1 text-3xl font-bold">گزارش و مدیریت سیستم</h2>
            <p className="mt-2 text-sm text-slate-500">
              اطلاعات مشتریان، ارائه‌دهندگان، فروشگاه‌ها، اجناس، سفارش‌ها و
              پیام‌ها.
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold hover:bg-slate-100"
          >
            <RefreshCw size={17} /> تازه‌سازی
          </button>
        </div>
        {stats && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "مشتریان",
                value: stats.customers,
                icon: <Users />,
                tab: "users" as Tab,
                role: "user" as const,
              },
              {
                label: "ارائه‌دهندگان",
                value: stats.owners,
                icon: <Users />,
                tab: "users" as Tab,
                role: "owner" as const,
              },
              {
                label: "فروشگاه‌ها",
                value: stats.shops,
                icon: <Store />,
                tab: "shops" as Tab,
              },
              {
                label: "اجناس",
                value: stats.items,
                icon: <Package />,
                tab: "items" as Tab,
              },
            ].map((card) => (
              <button
                key={card.label}
                onClick={() => {
                  setTab(card.tab);
                  if (card.role) setFilter(card.role);
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    {card.label}
                  </span>
                  <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    {card.icon}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold">
                  {card.value.toLocaleString("fa-AF")}
                </p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-7 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setSearch("");
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === item.key ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        {tab !== "admins" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                tab === "users"
                  ? "جستجو بر اساس نام، ایمیل یا شماره…"
                  : tab === "shops"
                    ? "جستجو بر اساس نام، توضیحات، آدرس…"
                    : tab === "items"
                      ? "جستجو بر اساس نام یا توضیحات جنس…"
                      : tab === "orders"
                        ? "جستجوی مشتری، ارائه‌دهنده، فروشگاه یا جنس…"
                        : "جستجوی نام فرستنده، ایمیل، موضوع یا متن پیام…"
              }
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        )}
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-14 text-center text-slate-500">
              در حال دریافت اطلاعات…
            </div>
          ) : (
            <>
              {tab === "users" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                    <h3 className="text-lg font-bold">فهرست کاربران</h3>
                    <div className="flex gap-2">
                      {(
                        [
                          { key: "all", label: "همه" },
                          { key: "user", label: "مشتریان" },
                          { key: "owner", label: "ارائه‌دهندگان" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setFilter(option.key)}
                          className={`rounded-lg px-3 py-2 text-sm font-bold ${filter === option.key ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shownUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700">
                            {user.profileImage ? (
                              <Image
                                src={user.profileImage}
                                alt=""
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Users size={18} />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {user.name}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {user.email} · {user.phone} ·{" "}
                              {user.role === "owner" ? "ارائه‌دهنده" : "مشتری"}
                            </span>
                          </span>
                          <ArrowUpRight size={16} className="text-slate-400" />
                        </Link>
                        {admin?.role === "master" && (
                          <button
                            disabled={busy === user.id}
                            onClick={() =>
                              void remove("users", user.id, user.name)
                            }
                            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={15} /> حذف
                          </button>
                        )}
                      </div>
                    ))}
                    {!shownUsers.length && (
                      <Empty text="کاربری مطابق جستجو پیدا نشد." />
                    )}
                  </div>
                </>
              )}
              {tab === "shops" && (
                <>
                  <div className="border-b border-slate-100 p-5">
                    <h3 className="text-lg font-bold"> {SHOP_LABEL_PLURAL} </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shownShops.map((shop) => (
                      <div
                        key={shop.id}
                        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <Link
                          href={`/shops/${shop.id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <Thumbnail src={shop.image} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {shop.name}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {shop.owner} · {shop.address || "بدون آدرس"}
                            </span>
                            <span className="mt-1 block line-clamp-1 text-xs text-slate-400">
                              {shop.description || "بدون توضیحات"}
                            </span>
                          </span>
                          <ArrowUpRight size={16} className="text-slate-400" />
                        </Link>
                        {admin?.role === "master" && (
                          <button
                            disabled={busy === shop.id}
                            onClick={() =>
                              void remove("shops", shop.id, shop.name)
                            }
                            className="inline-flex items-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> حذف
                          </button>
                        )}
                        {admin?.role === "master" && shop.active && (
                          <button
                            disabled={busy === shop.id}
                            onClick={() =>
                              void moderateShop(shop.id, "deactivate")
                            }
                            className="rounded-lg border px-3 py-2 text-sm font-bold"
                          >
                            غیرفعال‌سازی
                          </button>
                        )}
                      </div>
                    ))}
                    {!shownShops.length && (
                      <Empty text="مرکز کرایی مطابق جستجو پیدا نشد." />
                    )}
                  </div>
                </>
              )}
              {tab === "pendingShops" && admin?.role === "master" && (
                <>
                  <div className="border-b border-slate-100 p-5">
                    <h3 className="text-lg font-bold">
                      مراکز کرایی در انتظار تأیید
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shops
                      .filter((shop) => shop.active === false)
                      .map((shop) => (
                        <div
                          key={shop.id}
                          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <Thumbnail src={shop.image} />
                            <span>
                              <b>{shop.name}</b>
                              <span className="block text-sm text-slate-500">
                                {shop.owner} · {shop.address}
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={busy === shop.id}
                              onClick={() =>
                                void moderateShop(shop.id, "approve")
                              }
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white"
                            >
                              تأیید
                            </button>
                            <button
                              disabled={busy === shop.id}
                              onClick={() =>
                                void moderateShop(shop.id, "reject")
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                            >
                              رد و حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    {!shops.some((shop) => shop.active === false) && (
                      <Empty text="دکانی در انتظار تأیید نیست." />
                    )}
                  </div>
                </>
              )}
              {tab === "items" && (
                <>
                  <div className="border-b border-slate-100 p-5">
                    <h3 className="text-lg font-bold">اجناس ثبت‌ شده</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shownItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <Link
                          href={`/items/${item.id}`}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <Thumbnail src={item.image} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {item.name}
                            </span>
                            <span className="mt-1 block text-sm text-slate-500">
                              {item.shop} · {item.owner} · روزانه{" "}
                              {money(item.priceDaily || 0)}
                            </span>
                            <span className="mt-1 block line-clamp-1 text-xs text-slate-400">
                              {item.description || "بدون توضیحات"}
                            </span>
                          </span>
                          <ArrowUpRight size={16} className="text-slate-400" />
                        </Link>
                        {admin?.role === "master" && (
                          <button
                            disabled={busy === item.id}
                            onClick={() =>
                              void remove("items", item.id, item.name)
                            }
                            className="inline-flex items-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> حذف
                          </button>
                        )}
                      </div>
                    ))}
                    {!shownItems.length && (
                      <Empty text="جنسی مطابق جستجو پیدا نشد." />
                    )}
                  </div>
                </>
              )}
              {tab === "orders" && (
                <div className="p-4 sm:p-5">
                  <h3 className="mb-4 text-lg font-bold">
                    گزارش سفارش‌ها و مبالغ
                  </h3>
                  {report && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          { label: "تمام سفارش‌ ها", value: report.totalOrders },
                          {
                            label: "در انتظار پاسخ",
                            value: report.pendingCount,
                          },
                          { label: "ردشده", value: report.rejectedCount },
                          {
                            label: "تکمیل‌ شده و پرداخت‌ شده",
                            value: report.paidCount,
                          },
                        ].map((card) => (
                          <div
                            key={card.label}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <p className="text-sm text-slate-500">
                              {card.label}
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                              {card.value.toLocaleString("fa-AF")}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[
                          {
                            label: "مبلغ پرداخت تأیید شده",
                            value: report.paidAmount,
                          },
                          {
                            label: "مبلغ سفارش‌ های باز",
                            value: report.pendingAmount,
                          }, 
                          {
                            label: "مبلغ سفارش‌ های ردشده",
                            value: report.rejectedAmount,
                          },
                        ].map((card) => (
                          <div
                            key={card.label}
                            className="rounded-xl border border-blue-100 bg-blue-50 p-4"
                          >
                            <p className="text-sm text-blue-800">
                              {card.label}
                            </p>
                            <p className="mt-2 text-xl font-bold text-blue-950">
                              {money(card.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {shownOrders.map((order) => (
                      <article key={order.id} className="p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row">
                          <div>
                            <h4 className="font-bold">
                              {order.shop} — {order.customer}
                            </h4>
                            <p className="mt-1 text-sm text-slate-500">
                              ارائه‌ دهنده: {order.owner} · {order.customerEmail}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              آدرس {SHOP_LABEL}: {order.shopAddress || "ثبت نشده"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              آدرس مشتری: {order.customerAddress || "ثبت نشده"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleString(
                                "fa-AF",
                              )}
                            </p>
                          </div>
                          <div className="sm:text-left">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                              {
                                (
                                  {
                                    pending: "در انتظار پاسخ",
                                    accepted: "پذیرفته‌ شده",
                                    rejected: "ردشده",
                                    received: "در انتظار تأیید پرداخت",
                                    paid: "پرداخت تأیید شده",
                                  } as Record<string, string>
                                )[order.status]
                              }
                            </span>
                            <p className="mt-2 font-bold">
                              {money(order.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          {order.items
                            .map(
                              (item) =>
                                `${item.name} (${item.quantity} عدد × ${item.days} روز)`,
                            )
                            .join("، ")}
                        </p>
                      </article>
                    ))}
                    {!shownOrders.length && (
                      <Empty text="سفارشی مطابق جستجو پیدا نشد." />
                    )}
                  </div>
                </div>
              )}
              {tab === "messages" && (
                <>
                  <div className="border-b border-slate-100 p-5">
                    <h3 className="text-lg font-bold">پیام‌های تماس</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      مجموع: <b>{messages.length}</b> · خوانده‌ نشده:{" "}
                      <b className="text-amber-700">{unreadCount}</b>
                    </p>
                    {admin?.role !== "master" && (
                      <p className="mt-2 text-xs text-blue-700">
                        حساب مدیر عادی فقط امکان مشاهده پیام‌ها را دارد.
                      </p>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {shownMessages.map((message) => (
                      <article
                        key={message.id}
                        className={`p-5 ${message.status === "new" ? "bg-amber-50/60" : ""}`}
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold">{message.subject}</h4>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-bold ${message.status === "new" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                              >
                                {message.status === "new"
                                  ? "خوانده‌ نشده"
                                  : "دیده‌ شده"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {message.name} · {message.email}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(message.createdAt).toLocaleString(
                              "fa-AF",
                            )}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {message.message}
                        </p>
                        {admin?.role === "master" && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.status === "new" && (
                              <button
                                disabled={busy === message.id}
                                onClick={() =>
                                  void changeMessage(message.id, "read")
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                              >
                                <Eye size={15} /> دیده‌شده
                              </button>
                            )}
                            <button
                              disabled={busy === message.id}
                              onClick={() => void deleteMessage(message.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} /> حذف پیام
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                    {!shownMessages.length && (
                      <Empty text="پیامی مطابق جستجو پیدا نشد." />
                    )}
                  </div>
                </>
              )}
              {tab === "admins" && admin?.role === "master" && (
                <div className="p-5">
                  <h3 className="text-lg font-bold">مدیران عادی</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    مدیران عادی فقط گزارش‌ها را می‌بینند و اجازه حذف یا تغییر
                    اطلاعات ندارند.
                  </p>
                  <form
                    onSubmit={createAdmin}
                    noValidate
                    className="mt-5 grid gap-3 rounded-2xl border border-blue-100 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                  >
                    <label className="block text-sm font-bold">
                      نام ورود مدیر
                      <input
                        value={newName}
                        onChange={(event) => {
                          setNewName(event.target.value);
                          setAdminFormErrors((old) => ({
                            ...old,
                            name: undefined,
                          }));
                        }}
                        minLength={2}
                        maxLength={80}
                        className={`mt-2 w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-blue-500 ${adminFormErrors.name ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                        placeholder="مثلاً مدیر گزارش‌ها"
                      />
                      {adminFormErrors.name && (
                        <span className="mt-1 block text-xs font-medium text-red-600">
                          {adminFormErrors.name}
                        </span>
                      )}
                    </label>
                    <label className="block text-sm font-bold">
                      رمز عبور (حداقل ۸ حرف)
                      <input
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setAdminFormErrors((old) => ({
                            ...old,
                            password: undefined,
                          }));
                        }}
                        type="password"
                        minLength={8}
                        maxLength={100}
                        className={`mt-2 w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-blue-500 ${adminFormErrors.password ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                        placeholder="رمز را به مدیر بدهید"
                      />
                      {adminFormErrors.password && (
                        <span className="mt-1 block text-xs font-medium text-red-600">
                          {adminFormErrors.password}
                        </span>
                      )}
                    </label>
                    <button
                      disabled={busy === "create-admin"}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <UserPlus size={17} /> ساخت مدیر
                    </button>
                  </form>
                  <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {admins.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.active ? "فعال" : "غیرفعال"} · ایجادشده در{" "}
                            {new Date(item.createdAt).toLocaleDateString(
                              "fa-AF",
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busy === item.id}
                            onClick={() => void toggleAdmin(item)}
                            className={`rounded-lg border px-3 py-2 text-sm font-bold ${item.active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                          >
                            {item.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                          </button>
                          <button
                            disabled={busy === item.id}
                            onClick={() => void deleteAdmin(item.id, item.name)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} /> حذف مدیر
                          </button>
                        </div>
                      </div>
                    ))}
                    {!admins.length && (
                      <Empty text="هنوز مدیر عادی ساخته نشده است." />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="p-10 text-center text-sm text-slate-500">{text}</p>;
}
function Thumbnail({ src }: { src: string }) {
  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes="56px" />
      ) : (
        <Package size={20} />
      )}
    </span>
  );
}

export default function AdminPage() {
  return (
    <AdminRouteAccess>
      <AdminPageContent />
    </AdminRouteAccess>
  );
}