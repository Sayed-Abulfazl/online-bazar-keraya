"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Store,
  MapPin,
  Phone,
  Plus,
  X,
  LoaderCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOP_LABEL } from "@/constants";

type Shop = {
  id: string;
  name: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  ownerName: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage: string;
  address: string;
};

const shopFormSchema = z.object({
  name: z.string().trim().min(2, "نام فروشگاه حداقل ۲ حرف باشد.").max(100),
  description: z.string().trim().max(1000, "توضیحات حداکثر ۱۰۰۰ حرف باشد."),
  address: z.string().trim().min(3, "آدرس حداقل ۳ حرف باشد.").max(300),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
});

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState("");

  async function load() {
    try {
      const [s, u] = await Promise.all([
        axios.get("/api/shops"),
        axios.get("/api/auth/me"),
      ]);
      setShops(s.data.shops || []);
      setUser(u.data.user || null);
    } catch {
      toast.error("دریافت مراکز کرایی انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadMethod = () => {
      setSearch(new URLSearchParams(window.location.search).get("q") || "");
      void load();
    };
    loadMethod();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter((s) =>
      `${s.name} ${s.address} ${s.ownerName}`.toLowerCase().includes(q),
    );
  }, [shops, search]);

  function close() {
    if (saving) return;
    setModal(false);
    setImage(null);
    setPreview("");
    setForm({ name: "", description: "", address: "", phone: "" });
    setFieldErrors({});
    setImageError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const checked = shopFormSchema.safeParse(form);
    if (!checked.success) {
      const next: Record<string, string> = {};
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "");
        if (key && !next[key]) next[key] = issue.message;
      });
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    if (!image) {
      setImageError("انتخاب عکس فروشگاه الزامی است.");
      return;
    }
    setImageError("");
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      data.append("image", image);
      const response = await axios.post("/api/shops", data);
      toast.success(response.data.message || "فروشگاه ثبت شد و در انتظار تایید است.");
      close();
      await load();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "ثبت فروشگاه انجام نشد."
          : "خطا",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <Store size={17} /> بازار مراکز کرایی
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-5xl">
            مرکز کرایی مورد نیاز خود را{" "}
            <span className="text-blue-600">پیدا کنید</span>
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-slate-500">
            مراکز کرایی را ببینید، وسایل مورد نیاز خود را پیدا کنید و قیمت کرایه
            روزانه را بررسی کنید.
          </p>
          <div className="mt-7 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Search className="absolute mt-4 mr-4 text-slate-400" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی مرکز کرایه صاحب مرکز یا آدرس..."
                className="h-14 w-full rounded-2xl border bg-slate-50 pr-12 pl-4 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {user?.role === "owner" && (
          <div className="mb-8 rounded-2xl bg-slate-900 p-5 text-white flex flex-col sm:flex-row gap-5 justify-between items-center">
            <div>
              <h2 className="font-semibold">پنل ارائــه‌ دهنده</h2>
              <p className="mt-1 text-sm text-slate-300">
                هر ارائه‌ دهنده میتواند یک {SHOP_LABEL} ثبت کند و اجناسش را
                مدیریت نماید.
              </p>
            </div>
            <button
              onClick={() => setModal(true)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
            >
              <Plus size={19} /> ثبت {SHOP_LABEL}
            </button>
          </div>
        )}
        {loading ? (
          <p className="py-16 text-center text-slate-500">
            در حال بارگذاری مراکز کرایی
          </p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">
            مرکز کرایی پیدا نشد.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <article
                key={s.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/shops/${s.id}`}>
                  <div className="relative h-52 bg-slate-100">
                    {s.image && (
                      <Image
                        src={s.image}
                        alt={s.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {s.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {s.description ||
                        "برای دیدن اجناس و معلومات مرکز کرایه وارد شوید."}
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {s.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={16} />
                        {s.phone}
                      </p>
                    </div>
                    <p className="mt-4 font-bold text-blue-700">
                      مشاهده {SHOP_LABEL} ←
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            noValidate
            onSubmit={handleSubmit}
            className="my-5 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl sm:my-8 sm:p-9"
          >
            {shops.map((shop) => (
              <div key={shop.id}>
                {shop.ownerName === user?.name && (
                  <div className="bg-red-400 py-1 mx-auto rounded-lg flex justify-center items-center mb-5">
                    <p className="text-white text-xs sm:text-sm font-semibold">
                      شما در حال حاضر قادر به ثبت مرکز دیگری نیستید!
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">ثبت {SHOP_LABEL}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  معلومات {SHOP_LABEL} را کامل وارد کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { k: "name", label: "نام مرکر کرایی", required: true },
                  { k: "phone", label: "شماره تماس", required: true },
                  { k: "address", label: "آدرس", required: true },
                  { k: "description", label: "توضیحات", required: false },
                ] as const
              ).map((f) => (
                <label
                  key={f.k}
                  className={`text-sm font-bold ${f.k === "description" || f.k === "address" ? "sm:col-span-2" : ""}`}
                >
                  {f.label}
                  <input
                    className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500 ${fieldErrors[f.k] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                    value={form[f.k]}
                    onChange={(e) => {
                      setForm((old) => ({ ...old, [f.k]: e.target.value }));
                      setFieldErrors((old) => ({ ...old, [f.k]: "" }));
                    }}
                    required={f.required}
                    maxLength={
                      f.k === "description"
                        ? 1000
                        : f.k === "address"
                          ? 300
                          : 100
                    }
                  />
                  {fieldErrors[f.k] && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors[f.k]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold">
                عکس مرکز کرایه <span className="text-red-600">*</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG، PNG یا WEBP — حداکثر ۲ مگابایت
              </p>
              <input
                ref={inputRef}
                id="new-shop-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      f.type,
                    ) ||
                    f.size === 0 ||
                    f.size > 2 * 1024 * 1024
                  ) {
                    toast.error(
                      "عکس باید JPG، PNG یا WEBP و حداکثر ۲ مگابایت باشد.",
                    );
                    e.target.value = "";
                    return;
                  }
                  setImage(f);
                  setPreview(URL.createObjectURL(f));
                  setImageError("");
                }}
              />
              <label
                htmlFor="new-shop-image"
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-50"
              >
                <Plus size={16} />
                {preview ? "تغییر عکس" : "انتخاب عکس"}
              </label>
              {imageError && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {imageError}
                </p>
              )}
              {preview && (
                <div className="mt-4">
                  <Image
                    width={100}
                    height={100}
                    src={preview}
                    alt="پیش‌ نمایش عکس مرکز کرایه"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreview("");
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="mt-2 text-sm font-bold text-red-600"
                  >
                    حذف عکس انتخاب‌ شده
                  </button>
                </div>
              )}
            </div>
            <button
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <LoaderCircle className="animate-spin" size={18} />}{" "}
              {saving ? "در حال ثبت…" : "ثبت مرکز کرایی"}
            </button>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}
