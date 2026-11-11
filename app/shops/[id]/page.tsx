"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Phone,
  PackagePlus,
  Package,
  Trash2,
  Pencil,
  X,
  Save,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SHOP_LABEL, SHOP_LABEL_PLURAL } from "@/constants";

const editShopSchema = z.object({
  name: z.string().trim().min(2, "نام مرکز کرایه حداقل ۲ حرف باشد.").max(100),
  description: z.string().trim().max(1000, "توضیحات حداکثر ۱۰۰۰ حرف باشد."),
  address: z.string().trim().min(3, "آدرس الزامی است.").max(300),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
});

type Shop = {
  id: string;
  name: string;
  description: string;
  image: string;
  address: string;
  phone: string;
  ownerName: string;
  ownerId: string;
  averageRating: number;
  ratingCount: number;
  totalReceived: number;
};

type Item = {
  id: string;
  name: string;
  description: string;
  image: string;
  priceDaily: number;
  ownerId: string;
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

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        axios.get(`/api/shops/${id}`),
        axios.get("/api/auth/me"),
      ]);
      setShop(s.data.shop);
      setEditForm({
        name: s.data.shop.name,
        description: s.data.shop.description || "",
        address: s.data.shop.address,
        phone: s.data.shop.phone,
      });
      setItems(s.data.items || []);
      setUser(u.data.user || null);
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "مرکز کرایه پیدا نشد."
          : "خطا",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const loadMethod = () => {
      void load();
    }
    loadMethod();
  }, [load]);

  async function saveShop(e: React.FormEvent) {
    e.preventDefault();
    const checked = editShopSchema.safeParse(editForm);
    if (!checked.success) {
      const next: Record<string, string> = {};
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "");
        if (key && !next[key]) next[key] = issue.message;
      });
      setEditErrors(next);
      return;
    }
    setEditErrors({});
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v));
      if (editImage) data.append("image", editImage);
      const r = await axios.patch(`/api/shops/${id}`, data);
      toast.success(r.data.message || "مرکز کرایه ویرایش شد.");
      setEditOpen(false);
      setEditImage(null);
      setEditPreview("");
      await load();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "ویرایش مرکز کرایه انجام نشد."
          : "خطا",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteItem(item: Item) {
    if (!confirm(`جنس «${item.name}» حذف شود؟`)) return;
    try {
      await axios.delete(`/api/items/${item.id}`);
      toast.success("جنس حذف شد.");
      await load();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.message ||
              e.response?.data?.error ||
              "حذف انجام نشد."
          : "خطا",
      );
    }
  }
  const isOwner =
    !!user && !!shop && (user.id === shop.ownerId || user.id === shop.ownerId);
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/shops"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight size={17} /> همه {SHOP_LABEL_PLURAL}
        </Link>
        {loading ? (
          <p className="py-20 text-center">در حال بارگذاری…</p>
        ) : (
          shop && (
            <>
              <section className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm">
                <div className="grid md:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-64 bg-slate-100">
                    {shop.image && (
                      <Image
                        src={shop.image}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-6 sm:p-9">
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {SHOP_LABEL}
                    </span>
                    <h1 className="mt-4 text-3xl font-bold text-slate-900">
                      {shop.name}
                    </h1>
                    <p className="mt-4 leading-8 text-slate-600">
                      {shop.description ||
                        "برای معلومات بیشتر با مرکز کرایه تماس بگیرید."}
                    </p>
                    <div className="mt-6 space-y-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <MapPin size={17} />
                        {shop.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={17} />
                        {shop.phone}
                      </p>
                      <p>
                        ارائه‌ دهنده: <b>{shop.ownerName}</b>
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>امتیاز ارائه‌ دهنده:</span>
                        {shop.ratingCount > 0 ? (
                          <>
                            <span
                              className="inline-flex items-center gap-0.5"
                              aria-label={`امتیاز ${shop.averageRating.toFixed(1)} از ۵`}
                            >
                              {[1, 2, 3, 4, 5].map((star) => {
                                const fill = Math.max(
                                  0,
                                  Math.min(1, shop.averageRating - (star - 1)),
                                );
                                return (
                                  <span
                                    key={star}
                                    className="relative inline-block h-5 w-5"
                                  >
                                    <Star
                                      size={20}
                                      className="absolute inset-0 text-slate-300"
                                    />
                                    <span
                                      className="absolute inset-y-0 right-0 overflow-hidden"
                                      style={{ width: `${fill * 100}%` }}
                                    >
                                      <Star
                                        size={20}
                                        className="max-w-none text-amber-500"
                                        fill="currentColor"
                                      />
                                    </span>
                                  </span>
                                );
                              })}
                            </span>
                            <b className="text-amber-600">
                              {shop.averageRating.toFixed(1)} / 5
                            </b>
                            <span className="text-xs text-slate-500">
                              ({shop.ratingCount} رأی)
                            </span>
                          </>
                        ) : (
                          <b className="text-slate-500">
                            هنوز امتیازی ثبت نشده
                          </b>
                        )}
                      </div>
                      <p className="flex items-center gap-2">
                        مجموع کرایه‌های تکمیل‌شده:{" "}
                        <b className="text-emerald-700">
                          {Number(shop.totalReceived || 0).toLocaleString(
                            "fa-AF",
                          )}{" "}
                          افغانی
                        </b>
                      </p>
                    </div>
                    {isOwner && (
                      <div className="mt-7 flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditOpen(true)}
                          className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-bold hover:bg-slate-50"
                        >
                          <Pencil size={17} /> ویرایش مرکز کرایه
                        </button>
                        <Link
                          href={`/items/new?shopId=${shop.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                        >
                          <PackagePlus size={18} /> افزودن جنس
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              <section className="mt-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">اجناس این مرکز کرایه</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {items.length} جنس ثبت شده
                    </p>
                  </div>
                  {isOwner && (
                    <Link
                      href={`/items/new?shopId=${shop.id}`}
                      className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-100"
                    >
                      افزودن جنس
                    </Link>
                  )}
                </div>
                {items.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">
                    <Package className="mx-auto mb-3" size={30} />
                    هنوز جنسی ثبت نشده است.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <Link href={`/items/${item.id}`}>
                          <div className="relative h-52 bg-slate-100">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-slate-900">
                              {item.name}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {item.description || "توضیحاتی ثبت نشده است."}
                            </p>
                            <p className="mt-4 font-bold text-blue-700">
                              {item.priceDaily.toLocaleString("fa-AF")}{" "}
                              <span className="text-xs font-semibold">
                                افغانی / روز
                              </span>
                            </p>
                          </div>
                        </Link>
                        {isOwner && (
                          <div className="border-t p-3">
                            <button
                              onClick={() => void deleteItem(item)}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} /> حذف جنس
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        )}
      </main>
      {editOpen && shop && (
        <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 sm:items-center">
          <form
            noValidate
            onSubmit={saveShop}
            className="my-5 w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:my-8 sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">ویرایش مرکز کرایه</h2>
                <p className="mt-1 text-sm text-slate-500">
                  معلومات مرکز کرایه را به‌روز کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setEditImage(null);
                  setEditPreview("");
                }}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { key: "name", label: "نام مرکز کرایه" },
                  { key: "phone", label: "شماره تماس" },
                  { key: "address", label: "آدرس" },
                  { key: "description", label: "توضیحات" },
                ] as const
              ).map((f) => (
                <label
                  key={f.key}
                  className={`text-sm font-bold ${f.key === "description" ? "sm:col-span-2" : ""}`}
                >
                  {f.label}
                  <input
                    value={editForm[f.key]}
                    onChange={(e) => {
                      setEditForm((old) => ({
                        ...old,
                        [f.key]: e.target.value,
                      }));
                      setEditErrors((old) => ({ ...old, [f.key]: "" }));
                    }}
                    className={`mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 ${editErrors[f.key] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  />
                  {editErrors[f.key] && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {editErrors[f.key]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold">عکس مرکز کرایه (اختیاری)</p>
              <input
                id="edit-shop-image"
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
                    e.currentTarget.value = "";
                    return;
                  }
                  setEditImage(f);
                  setEditPreview(URL.createObjectURL(f));
                }}
              />
              <label
                htmlFor="edit-shop-image"
                className="mt-3 inline-flex cursor-pointer rounded-xl border bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-100"
              >
                انتخاب عکس جدید
              </label>
              {(editPreview || shop.image) && (
                <Image
                  width={100}
                  height={100}
                  src={editPreview || shop.image}
                  alt="پیش‌نمایش عکس مرکز کرایه"
                  className="mt-4 h-40 w-full rounded-xl object-cover"
                />
              )}
            </div>
            <button
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </button>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}
