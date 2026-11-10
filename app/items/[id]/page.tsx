"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Phone,
  Store,
  Trash2,
  ShoppingCart,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { UserSummary, ItemSummary, CartLine } from "@/types";
type Item = {
  id: string;
  name: string;
  description: string;
  image: string;
  priceDaily: number;
  shop: {
    id: string;
    name: string;
    address: string;
    phone: string;
    image: string;
  };
  ownerId: string;
};
type Related = {
  id: string;
  name: string;
  image: string;
  priceDaily: number;
  shop?: { name: string };
  shopId?: string;
};
const editItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام جنس حداقل ۲ حرف باشد.")
    .max(100, "نام جنس حداکثر ۱۰۰ حرف باشد."),
  description: z.string().trim().max(1000, "توضیحات حداکثر ۱۰۰۰ حرف باشد."),
  priceDaily: z.coerce.number().min(1, "قیمت روزانه باید حداقل ۱ افغانی باشد."),
});
export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const imageRef = useRef<HTMLInputElement>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [item, setItem] = useState<Item | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [related, setRelated] = useState<Related[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceDaily: "",
  });
  useEffect(() => {
    let active = true;
    Promise.all([
      axios.get(`/api/items/${id}`),
      axios.get("/api/auth/me").catch(() => ({ data: { user: null } })),
      axios.get("/api/items").catch(() => ({ data: { items: [] } })),
    ])
      .then(([r, u, all]) => {
        if (!active) return;
        const it = r.data.item as Item;
        setItem(it);
        setUser(u.data.user || null);
        setForm({
          name: it.name,
          description: it.description || "",
          priceDaily: String(it.priceDaily),
        });
        const q = it.name
          .toLocaleLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2);
        setRelated(
          (all.data.items || [])
            .map(
              (x: ItemSummary): Related => ({
                id: String(x._id || x.id || ""),
                name: x.name,
                image: x.image,
                priceDaily: x.priceDaily,
                shop:
                  typeof x.shop === "object" &&
                  x.shop &&
                  "name" in x.shop &&
                  typeof x.shop.name === "string"
                    ? { name: x.shop.name }
                    : undefined,
                shopId: String(
                  (typeof x.shop === "object" && x.shop && "_id" in x.shop
                    ? x.shop._id
                    : undefined) ||
                    x.shopId ||
                    (typeof x.shop === "string" ? x.shop : ""),
                ),
              }),
            )
            .filter(
              (x: { id: string; name: string }) =>
                x.id !== it.id &&
                q.length > 0 &&
                q.some((w) => x.name.toLocaleLowerCase().includes(w)),
            )
            .slice(0, 4),
        );
      })
      .catch((e) =>
        toast.error(
          axios.isAxiosError(e)
            ? e.response?.data?.error || "جنس پیدا نشد."
            : "خطا",
        ),
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const isOwner =
    !!user && !!item && (user.id === item.ownerId || user._id === item.ownerId);
  function addCart() {
    if (!item) return;
    const parsed: unknown = JSON.parse(localStorage.getItem("ky-cart") || "[]");
    const raw: unknown[] = Array.isArray(parsed) ? parsed : [];
    const cartById = new Map<string, CartLine>();
    for (const entry of raw) {
      if (typeof entry === "string") {
        if (!cartById.has(entry))
          cartById.set(entry, {
            id: entry,
            quantity: 1,
            days: 1,
            selected: true,
          });
        continue;
      }
      if (!entry || typeof entry !== "object" || !("id" in entry)) continue;
      const value = entry as {
        id: unknown;
        quantity?: unknown;
        days?: unknown;
        selected?: unknown;
      };
      if (typeof value.id !== "string" || !value.id || cartById.has(value.id))
        continue;
      cartById.set(value.id, {
        id: value.id,
        quantity:
          typeof value.quantity === "number" ? Math.max(1, value.quantity) : 1,
        days: typeof value.days === "number" ? Math.max(1, value.days) : 1,
        selected: value.selected !== false,
      });
    }
    const cart = [...cartById.values()];
    if (cart.some((x) => String(x.id) === item.id)) {
      toast.info("این جنس قبلاً در سبد است.");
      return;
    }
    cart.push({ id: item.id, quantity: 1, days: 1, selected: true });
    localStorage.setItem("ky-cart", JSON.stringify(cart));
    toast.success("جنس به سبد انتخاب‌ها اضافه شد.");
  }
  async function remove() {
    if (!item || !confirm(`جنس «${item.name}» حذف شود؟`)) return;
    try {
      await axios.delete(`/api/items/${id}`);
      toast.success("جنس حذف شد.");
      router.push(`/shops/${item.shop.id}`);
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
  async function save() {
    if (!item) return;
    const checked = editItemSchema.safeParse(form);
    if (!checked.success) {
      toast.error(
        checked.error.issues[0]?.message || "معلومات جنس را بررسی کنید.",
      );
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("priceDaily", form.priceDaily);
      if (editImage) data.append("image", editImage);
      const r = await axios.put(`/api/items/${id}`, data);
      toast.success(r.data.message || "جنس ویرایش شد.");
      setEditing(false);
      setEditImage(null);
      setEditPreview("");
      const updated = await axios.get(`/api/items/${id}`);
      setItem(updated.data.item);
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.message ||
              e.response?.data?.error ||
              "ویرایش انجام نشد."
          : "خطا",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/items"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowRight size={17} /> برگشت به اجناس
        </Link>
        {loading ? (
          <p className="py-20 text-center">در حال بارگذاری…</p>
        ) : (
          item && (
            <>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-72 bg-slate-100">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-6 sm:p-9">
                    <p className="text-sm font-bold text-blue-700">جنس کرایی</p>
                    {editing ? (
                      <div className="mt-3 space-y-4">
                        <label className="block text-sm font-bold">
                          نام جنس
                          <input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                          />
                        </label>
                        <label className="block text-sm font-bold">
                          توضیحات
                          <textarea
                            value={form.description}
                            onChange={(e) =>
                              setForm({ ...form, description: e.target.value })
                            }
                            rows={3}
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                          />
                        </label>
                        <label className="block text-sm font-bold">
                          قیمت روزانه (افغانی)
                          <input
                            type="number"
                            min="1"
                            value={form.priceDaily}
                            onChange={(e) =>
                              setForm({ ...form, priceDaily: e.target.value })
                            }
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                          />
                        </label>
                        <div className="rounded-xl border border-dashed p-4">
                          <p className="text-sm font-bold">عکس جنس (اختیاری)</p>
                          <input
                            ref={imageRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (
                                ![
                                  "image/jpeg",
                                  "image/png",
                                  "image/webp",
                                ].includes(f.type) ||
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
                          <button
                            type="button"
                            onClick={() => imageRef.current?.click()}
                            className="mt-2 rounded-lg border px-3 py-2 text-sm font-bold"
                          >
                            انتخاب عکس جدید
                          </button>
                          {(editPreview || item.image) && (
                            <Image
                              width={100}
                              height={100}
                              src={editPreview || item.image}
                              alt="پیش‌نمایش جنس"
                              className="mt-3 h-36 w-full rounded-xl object-cover"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => void save()}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                          >
                            <Save size={17} /> ذخیره
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false);
                              setEditImage(null);
                              setEditPreview("");
                              setForm({
                                name: item.name,
                                description: item.description || "",
                                priceDaily: String(item.priceDaily),
                              });
                              if (imageRef.current) imageRef.current.value = "";
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-bold"
                          >
                            <X size={17} /> لغو
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="mt-3 text-3xl font-bold">{item.name}</h1>
                        <p className="mt-4 leading-8 text-slate-600">
                          {item.description ||
                            "توضیحاتی برای این جنس ثبت نشده است."}
                        </p>
                        <div className="mt-7 rounded-2xl bg-blue-50 p-5">
                          <p className="text-sm text-blue-800">
                            قیمت کرایه روزانه
                          </p>
                          <p className="mt-2 text-3xl font-bold text-blue-800">
                            {Number(item.priceDaily).toLocaleString("fa-AF")}{" "}
                            <span className="text-sm">افغانی</span>
                          </p>
                        </div>
                        <Link
                          href={`/shops/${item.shop.id}`}
                          className="mt-6 flex items-center gap-3 rounded-xl border p-4 hover:bg-slate-50"
                        >
                          <Store size={22} className="text-blue-700" />
                          <div>
                            <p className="font-bold">{item.shop.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                              <MapPin size={14} />
                              {item.shop.address}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                              <Phone size={14} />
                              {item.shop.phone}
                            </p>
                          </div>
                        </Link>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {(!user || user.role === "user") && (
                            <>
                              <button
                                onClick={addCart}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                              >
                                <ShoppingCart size={18} /> افزودن به سبد
                              </button>
                              <Link
                                href="/cart"
                                className="rounded-xl border px-5 py-3 font-bold hover:bg-slate-50"
                              >
                                رفتن به سبد
                              </Link>
                            </>
                          )}
                          {isOwner && (
                            <>
                              <button
                                onClick={() => {
                                  setForm({
                                    name: item.name,
                                    description: item.description || "",
                                    priceDaily: String(item.priceDaily),
                                  });
                                  setEditImage(null);
                                  setEditPreview("");
                                  if (imageRef.current)
                                    imageRef.current.value = "";
                                  setEditing(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-bold"
                              >
                                <Pencil size={17} /> ویرایش جنس
                              </button>
                              <button
                                onClick={() => void remove()}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-bold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={17} /> حذف جنس
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {related.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold">اجناس مرتبط</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    فقط اجناس با نام مشابه
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {related.map((x) => (
                      <Link
                        key={x.id}
                        href={`/items/${x.id}`}
                        className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative h-40 bg-slate-100">
                          {x.image && (
                            <Image
                              src={x.image}
                              alt={x.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold">{x.name}</h3>
                          <p className="mt-2 font-bold text-blue-800">
                            {x.priceDaily.toLocaleString("fa-AF")} افغانی / روز
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
