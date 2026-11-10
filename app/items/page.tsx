"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Search, PackageOpen, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOP_LABEL } from "@/constants";
import type { CartLine } from "@/types";

type Item = {
  id: string;
  _id?: string;
  name: string;
  description: string;
  image: string;
  priceDaily: number;
  shop?: { name: string; _id?: string } | string;
  shopId?: string;
};
type CartEntry = Partial<Omit<CartLine, "id">> & Pick<CartLine, "id">;
type CurrentUser = {
  id?: string;
  _id?: string;
  role: "user" | "owner" | "admin";
};
export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const loadMethod = () => {
        setQuery(new URLSearchParams(window.location.search).get("q") || "");
        Promise.all([
          axios.get("/api/items"),
          axios.get("/api/auth/me").catch(() => ({ data: { user: null } })),
        ])
          .then(([r, u]) => {
            setItems(
              (r.data.items || []).map((x: Item) => ({
                ...x,
                id: String(x._id || x.id),
                shopId: String(
                  typeof x.shop === "object" && x.shop
                    ? (x.shop as { _id?: string })._id || x.shopId || ""
                    : x.shopId || x.shop || "",
                ),
              })),
            );
            setUser(u.data.user || null);
          })
          .catch(() => toast.error("گرفتن فهرست اجناس انجام نشد."))
          .finally(() => setLoading(false));
    }
    loadMethod();
  }, []);
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return items.filter(
      (i) => !q || `${i.name} ${i.description}`.toLocaleLowerCase().includes(q),
    );
  }, [items, query]);
  function add(id: string) {
    try {
      const raw = JSON.parse(
        localStorage.getItem("ky-cart") || "[]",
      ) as unknown[];
      const cart = Array.from(
        new Map(
          raw
            .filter(
              (x): x is string | CartEntry =>
                typeof x === "string" ||
                (!!x &&
                  typeof x === "object" &&
                  "id" in x &&
                  typeof (x as { id?: unknown }).id === "string"),
            )
            .map((x) => {
              const line: CartEntry =
                typeof x === "string"
                  ? { id: x, quantity: 1, days: 1, selected: true }
                  : x;
              return [
                String(line.id),
                { ...line, id: String(line.id) },
              ] as const;
            }),
        ).values(),
      );
      if (cart.some((x) => String(x.id) === id)) {
        toast.info("این جنس قبلاً در سبد است.");
        return;
      }
      cart.push({ id, quantity: 1, days: 1, selected: true });
      localStorage.setItem("ky-cart", JSON.stringify(cart));
      toast.success("جنس به سبد اضافه شد.");
    } catch {
      toast.error("سبد خرید در دسترس نیست.");
    }
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-bold text-blue-700">بازار کرایه</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              همهٔ اجناس
            </h1>
            <p className="mt-2 text-slate-500">
              جنس مورد نیازت را جستجو و به سبد اضافه کن.
            </p>
          </div>
          {(!user || user.role === "user") && (
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
            >
              <ShoppingCart size={18} /> سبد انتخاب‌ها
            </Link>
          )}
        </div>
        <label className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="text-slate-400" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام جنس یا توضیحات…"
            className="w-full bg-transparent outline-none"
          />
        </label>
        {loading ? (
          <p className="py-20 text-center text-slate-500">
            در حال بارگذاری اجناس…
          </p>
        ) : shown.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/items/${item.id}`} className="block">
                  <div className="relative h-52 bg-slate-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <PackageOpen className="m-auto" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-blue-700">
                      {(typeof item.shop === "object"
                        ? item.shop?.name
                        : undefined) || SHOP_LABEL}
                    </p>
                    <h2 className="mt-2 truncate text-lg font-bold text-slate-900">
                      {item.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                      {item.description || "توضیحی ثبت نشده است."}
                    </p>
                    <p className="mt-4 font-bold text-blue-800">
                      {Number(item.priceDaily).toLocaleString("fa-AF")} افغانی{" "}
                      <span className="text-xs font-medium">/ روز</span>
                    </p>
                  </div>
                </Link>
                {(!user || user.role === "user") && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => add(item.id)}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100"
                    >
                      افزودن به سبد
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-white px-5 py-16 text-center">
            <PackageOpen className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-xl font-bold">جنس پیدا نشد</h2>
            <p className="mt-2 text-slate-500">
              عبارت دیگری را جستجو کن یا بعداً دوباره سر بزن.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
