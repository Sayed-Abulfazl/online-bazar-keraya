"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  ArrowRight,
  Minus,
  Plus,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserRouteAccess } from "@/components/RouteAccess";
import type { CartLine } from "@/types";

type Item = {
  id: string;
  name: string;
  image: string;
  priceDaily: number;
  shop?: { name: string; address?: string };
};
type ApiItem = Item & { _id?: string };
const readCart = (): CartLine[] => {
  try {
    const data: unknown = JSON.parse(localStorage.getItem("ky-cart") || "[]");
    if (!Array.isArray(data)) return [];
    const unique = new Map<string, CartLine>();
    for (const raw of data) {
      const x =
        typeof raw === "string"
          ? { id: raw }
          : raw && typeof raw === "object"
            ? (raw as Record<string, unknown>)
            : null;
      if (!x || x.id == null || !String(x.id).trim()) continue;
      const id = String(x.id);
      if (unique.has(id)) continue;
      unique.set(id, {
        id,
        quantity: Math.max(1, Math.min(100, Number(x.quantity) || 1)),
        days: Math.max(1, Math.min(365, Number(x.days) || 1)),
        selected: x.selected !== false,
      });
    }
    return [...unique.values()];
  } catch {
    return [];
  }
};
function CartPageContent() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customerAddress, setCustomerAddress] = useState("");

  useEffect(() => {
    const loadMethod = () => {
      const saved = readCart();
      setCart(saved);
      localStorage.setItem("ky-cart", JSON.stringify(saved));
      axios
        .get("/api/auth/me")
        .then((me) => setCustomerAddress(me.data.user?.address || ""))
        .catch(() => setCustomerAddress(""));
      if (!saved.length) {
        setLoading(false);
        return;
      }
      axios
        .get("/api/items")
        .then((r) => {
          const seen = new Set<string>();
          const all: Item[] = (r.data.items || [])
            .map((x: ApiItem) => ({ ...x, id: String(x._id || x.id) }))
            .filter((x: Item) => {
              if (!x.id || seen.has(x.id)) return false;
              seen.add(x.id);
              return true;
            });
          const available = all.filter((x) =>
            saved.some((line) => line.id === x.id),
          );
          const validIds = new Set(available.map((x) => x.id));
          const validCart = saved.filter((line) => validIds.has(line.id));
          setItems(available);
          setCart(validCart);
          localStorage.setItem("ky-cart", JSON.stringify(validCart));
          if (saved.length > validCart.length)
            toast.info("اجناس تکراری یا دیگر در دسترس، از سبد حذف شدند.");
        })
        .catch(() => toast.error("دریافت سبد انجام نشد."))
        .finally(() => setLoading(false));
    };
    loadMethod();
  }, []);

  function update(next: CartLine[]) {
    setCart(next);
    localStorage.setItem("ky-cart", JSON.stringify(next));
  }

  function change(id: string, key: "quantity" | "days", delta: number) {
    update(
      cart.map((line) =>
        line.id === id
          ? {
              ...line,
              [key]: Math.max(
                1,
                Math.min(key === "quantity" ? 100 : 365, line[key] + delta),
              ),
            }
          : line,
      ),
    );
  }
  function toggle(id: string) {
    update(
      cart.map((line) =>
        line.id === id ? { ...line, selected: !line.selected } : line,
      ),
    );
  }
  function toggleAll() {
    const visibleIds = new Set(items.map((item) => item.id));
    const visibleCart = cart.filter((line) => visibleIds.has(line.id));
    const selectAll = visibleCart.some((line) => !line.selected);
    update(
      cart.map((line) =>
        visibleIds.has(line.id) ? { ...line, selected: selectAll } : line,
      ),
    );
  }
  function remove(id: string) {
    update(cart.filter((x) => x.id !== id));
    setItems((old) => old.filter((x) => x.id !== id));
    toast.success("جنس از سبد حذف شد.");
  }
  const visibleIds = new Set(items.map((item) => item.id));
  const selected = cart.filter((x) => x.selected && visibleIds.has(x.id));
  const allVisibleSelected =
    items.length > 0 &&
    items.every((item) => selected.some((line) => line.id === item.id));
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const line = selected.find((x) => x.id === item.id);
        return sum + (line ? item.priceDaily * line.quantity * line.days : 0);
      }, 0),
    [items, selected],
  );
  async function order() {
    if (!selected.length) {
      toast.error("ابتدا یک یا چند جنس را انتخاب کن.");
      return;
    }
    setBusy(true);
    try {
      const me = await axios.get("/api/auth/me");
      if (!me.data.user) {
        toast.error("برای سفارش دادن وارد حساب مشتری شو.");
        router.push("/login");
        return;
      }
      if (me.data.user.role !== "user") {
        toast.error("ثبت سفارش فقط برای مشتری امکان دارد.");
        return;
      }
      if (!String(me.data.user.address || "").trim()) {
        toast.error("برای ثبت سفارش، ابتدا آدرس خود را در پروفایل ثبت کن.");
        router.push("/profile");
        return;
      }
      const r = await axios.post("/api/orders", {
        items: selected.map((line) => ({
          itemId: line.id,
          quantity: line.quantity,
          days: line.days,
        })),
      });
      toast.success(r.data.message);
      update(cart.filter((line) => !line.selected));
      setItems((old) =>
        old.filter((item) => !selected.some((line) => line.id === item.id)),
      );
      router.push("/dashboard/orders");
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "ثبت سفارش انجام نشد."
          : "خطا در ثبت سفارش",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <Link
          href="/items"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowRight size={17} /> برگشت به اجناس
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <span className="rounded-2xl bg-blue-100 p-3 text-blue-700">
            <ShoppingCart size={25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">سبد انتخاب‌ها</h1>
            <p className="mt-1 text-sm text-slate-500">
              تعداد و مدت کرایه را تنظیم کن؛ مبلغ به‌صورت خودکار حساب می‌شود.
            </p>
          </div>
        </div>
        {loading ? (
          <p className="py-20 text-center text-slate-500">در حال بارگذاری…</p>
        ) : items.length ? (
          <>
            <button
              onClick={toggleAll}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"
            >
              <CheckSquare size={17} />
              {allVisibleSelected ? "لغو انتخاب همه" : "انتخاب همه"}
            </button>
            <div className="mt-4 space-y-4">
              {items.map((item) => {
                const line = cart.find((x) => x.id === item.id);
                if (!line) return null;
                const lineTotal = item.priceDaily * line.quantity * line.days;
                return (
                  <article
                    key={item.id}
                    className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${line.selected ? "border-blue-300" : "border-slate-200 opacity-80"}`}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={() => toggle(item.id)}
                        className="mt-2 h-5 w-5 accent-blue-600"
                        aria-label={`انتخاب ${item.name}`}
                      />
                      <Link
                        href={`/items/${item.id}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/items/${item.id}`}
                          className="font-bold hover:text-blue-700"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.priceDaily.toLocaleString("fa-AF")} افغانی / روز
                        </p>
                        {item.shop?.address && (
                          <p className="mt-1 text-xs text-slate-500">
                            آدرس ارائه‌دهنده: {item.shop.address}
                          </p>
                        )}
                        <p className="mt-2 font-bold text-blue-700">
                          مجموع این جنس: {lineTotal.toLocaleString("fa-AF")}{" "}
                          افغانی
                        </p>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="self-start rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:max-w-md">
                      <Control
                        title="تعداد"
                        value={line.quantity}
                        minus={() => change(item.id, "quantity", -1)}
                        plus={() => change(item.id, "quantity", 1)}
                      />
                      <Control
                        title="مدت کرایه (روز)"
                        value={line.days}
                        minus={() => change(item.id, "days", -1)}
                        plus={() => change(item.id, "days", 1)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="mb-4 rounded-xl bg-white/70 p-3">
                <p className="text-sm font-bold text-blue-900">
                  آدرس ثبت‌شدهٔ شما
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  {customerAddress ||
                    "آدرسی ثبت نشده؛ پیش از سفارش آن را در پروفایل اضافه کنید."}
                </p>
                <Link
                  href="/profile"
                  className="mt-2 inline-block text-sm font-bold text-blue-700 underline"
                >
                  ویرایش آدرس
                </Link>
              </div>
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-800">
                    مجموع انتخاب‌شده
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-950">
                    {total.toLocaleString("fa-AF")} افغانی
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    مبلغ نهایی با تعداد و روز کرایه محاسبه شده است.
                  </p>
                </div>
                <button
                  onClick={() => void order()}
                  disabled={busy || !selected.length}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:mt-0 sm:w-auto"
                >
                  {busy ? "در حال ثبت…" : `ثبت درخواست (${selected.length})`}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-white px-5 py-16 text-center">
            <ShoppingCart className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-xl font-bold">سبد انتخاب‌ها خالی است</h2>
            <Link
              href="/items"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              دیدن اجناس
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
function Control({
  title,
  value,
  minus,
  plus,
}: {
  title: string;
  value: number;
  minus: () => void;
  plus: () => void;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-2 text-xs font-bold text-slate-500">{title}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={minus}
          aria-label="کاهش"
          className="rounded-lg border bg-white p-2 hover:bg-blue-50"
        >
          <Minus size={15} />
        </button>
        <span className="text-lg font-bold">
          {value.toLocaleString("fa-AF")}
        </span>
        <button
          onClick={plus}
          aria-label="افزایش"
          className="rounded-lg border bg-white p-2 hover:bg-blue-50"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <UserRouteAccess allow={["user"]}>
      <CartPageContent />
    </UserRouteAccess>
  );
}
