"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Store,
  PackageOpen,
  ArrowLeft,
  MapPin,
  ShoppingCart,
  StoreIcon,
  ShoppingCartPlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_NAME, SHOP_LABEL, SHOP_LABEL_PLURAL } from "@/constants";

type Shop = {
  id: string;
  name: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  ownerName: string;
};
type Item = {
  id: string;
  name: string;
  description: string;
  image: string;
  priceDaily: number;
  shop?: { name: string; address?: string };
};
export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([axios.get("/api/shops"), axios.get("/api/items")])
      .then(([s, i]) => {
        setShops(s.data.shops || []);
        setItems(i.data.items || []);
      })
      .catch(() => toast.error("دریافت معلومات بازار انجام نشد."))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return items.filter(
      (i) => !q || `${i.name} ${i.description}`.toLocaleLowerCase().includes(q),
    );
  }, [items, query]);

  const filteredShops = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return shops.filter(
      (s) =>
        !q ||
        `${s.name} ${s.address} ${s.ownerName}`.toLocaleLowerCase().includes(q),
    );
  }, [shops, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-teal-900 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Store size={16} />
              {APP_NAME}؛ بازار آنلاین کرایه
            </span>
            <h1 className="mt-6 text-4xl font-medium leading-tight sm:text-5xl md:text-6xl">
              هر چیزی که برای کرایه میخواهید
              <span className="mt-2 block text-blue-300">اینجا پیدا کنید</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50/80 sm:text-lg">
              {SHOP_LABEL_PLURAL} و اجناس کرایی را جستجو کنید، قیمت روزانه را
              ببینید انتخاب‌ هایتان را به سبد اضافه کنید و درخواست کرایه
              بفرستید.
            </p>
            <div className="mt-8 sm:flex flex-wrap items-center gap-3 hidden">
              <Link
                href="/items"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-950 hover:bg-blue-50"
              >
                دیدن همه اجناس <ArrowLeft size={18} />
              </Link>
              <Link
                href="/shops"
                className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold text-white hover:bg-white/15"
              >
                دیدن {SHOP_LABEL_PLURAL}
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3.5 font-bold text-white hover:bg-white/10"
              >
                <ShoppingCart size={18} /> سبد انتخاب‌ها
              </Link>
            </div>

            <div className="grid grid-cols-3 justify-center items-center gap-3 mt-6 sm:hidden">
              <Link
                href={"/items"}
                className="bg-[rgba(255,255,255,0.1)] p-5 rounded-2xl flex justify-center items-center"
              >
                <div>
                  <ShoppingCartPlusIcon size={20} color="white" />
                </div>
              </Link>
              <Link
                href={"/shops"}
                className="bg-[rgba(255,255,255,0.1)] p-5 rounded-2xl flex justify-center items-center"
              >
                <div>
                  <StoreIcon size={20} color="white" />
                </div>
              </Link>
              <Link
                href={"/cart"}
                className="bg-[rgba(255,255,255,0.1)] p-5 rounded-2xl flex justify-center items-center"
              >
                <div>
                  <ShoppingCart size={20} color="white" />
                </div>
              </Link>
            </div>
          </div>
          <div className="relative mt-10 max-w-3xl">
            <label className="flex items-center gap-3 rounded-2xl bg-white p-2 text-slate-900 shadow-2xl">
              <span className="ps-3 text-blue-700">
                <Search size={22} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی جنس، نام مرکز کرایه یا آدرس…"
                className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                aria-label="جستجوی اجناس و مراکز کرایه"
              />
              <Link
                href={`/items${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                aria-label="دیدن تمام نتایج اجناس"
                className="hidden sm:block rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                جستجو
              </Link>
            </label>
            <div className="flex justify-center items-center mt-3">
              <Link
                href={`/items${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                aria-label="دیدن تمام نتایج اجناس"
                className="rounded-xl w-[100%] flex justify-center items-center sm:hidden bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                جستجو
              </Link>
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-700">جستجو و انتخاب</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                اجناس موجود برای کرایه
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {query
                  ? `نتیجه‌های جستجو برای «${query}»`
                  : `${items.length} جنس ثبت شده در بازار`}
              </p>
            </div>
            <Link
              href="/items"
              className="shrink-0 text-sm font-bold text-blue-700 hover:underline"
            >
              همه اجناس ←
            </Link>
          </div>
          {loading ? (
            <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
              در حال بارگذاری…
            </p>
          ) : filteredItems.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredItems.slice(0, 4).map((i) => (
                <Link
                  key={i.id}
                  href={`/items/${i.id}`}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 bg-slate-100">
                    {i.image ? (
                      <Image
                        src={i.image}
                        alt={i.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <PackageOpen className="m-auto" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold text-blue-700">
                      {i.shop?.name || SHOP_LABEL}
                    </p>
                    <h3 className="mt-2 truncate font-bold text-slate-900">
                      {i.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                      {i.description || "توضیحی ثبت نشده است."}
                    </p>
                    <p className="mt-4 font-bold text-blue-800">
                      {Number(i.priceDaily).toLocaleString("fa-AF")} افغانی{" "}
                      <span className="text-xs font-medium">/ روز</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
              <PackageOpen className="mx-auto text-slate-300" size={36} />
              <p className="mt-3 font-bold">جنس مطابق جستجوی شما پیدا نشد.</p>
              <Link
                href="/items"
                className="mt-3 inline-block font-bold text-blue-700"
              >
                دیدن فهرست کامل اجناس
              </Link>
            </div>
          )}
        </section>
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-700">
                مراکز کرایی بازار
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                مراکز کرایی
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {SHOP_LABEL} را باز کن و تمام اجناس آن را ببین.
              </p>
            </div>
            <Link
              href="/shops"
              className="shrink-0 text-sm font-bold text-blue-700 hover:underline"
            >
              همه {SHOP_LABEL_PLURAL} ←
            </Link>
          </div>
          {loading ? (
            <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
              در حال بارگذاری…
            </p>
          ) : filteredShops.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShops.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  href={`/shops/${s.id}`}
                  className="flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-36 w-36 shrink-0 bg-slate-100 sm:h-40 sm:w-40">
                    {s.image && (
                      <Image
                        src={s.image}
                        alt={s.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 p-4">
                    <h3 className="truncate text-lg font-bold">{s.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {s.description || "اجناس این مرکز کرایه را مشاهده کنید."}
                    </p>
                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={14} />
                      {s.address}
                    </p>
                    <p className="mt-3 text-sm font-bold text-blue-700">
                      مشاهده {SHOP_LABEL} ←
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-slate-500">
              {query
                ? "مرکز کرایه ای مطابق جستجو پیدا نشد."
                : "هنوز مرکز کرایه ای ثبت نشده است."}
            </div>
          )}
        </section>
        <section className="mt-14 rounded-3xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-medium sm:text-3xl">
            {SHOP_LABEL} داری؟
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            به‌عنوان ارائه‌ دهنده ثبت‌ نام کن، مرکز کرایه ات را بساز و اجناس
            کرایی را معرفی کن.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-xl bg-blue-500 px-6 py-3.5 font-bold text-slate-950 hover:bg-blue-400"
          >
            ثبت‌ نام ارائه‌ دهنده
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
