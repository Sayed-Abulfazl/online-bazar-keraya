"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Store,
  Trash2,
  Clock3,
  CheckCircle2,
  Wallet,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserRouteAccess } from "@/components/RouteAccess";
type Order = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "received" | "paid";
  rating: number | null;
  items: {
    itemId: string;
    name: string;
    image: string;
    priceDaily: number;
    quantity: number;
    days: number;
    lineTotal: number;
  }[];
  shop: { id: string; name: string; phone: string; address: string } | null;
  createdAt: string;
  totalDaily: number;
  totalAmount: number;
};
const labels: Record<Order["status"], string> = {
  pending: "در انتظار پاسخ",
  accepted: "در انتظار رسیدن اجناس",
  rejected: "رد شده",
  received: "در انتظار تأیید پرداخت",
  paid: "معامله تکمیل شد",
};
const styles: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-blue-50 text-blue-800",
  rejected: "bg-red-50 text-red-700",
  received: "bg-violet-50 text-violet-800",
  paid: "bg-blue-50 text-blue-800",
};
function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    completedCount: 0,
  });
  const [busy, setBusy] = useState("");
  const [selectedRatings, setSelectedRatings] = useState<
    Record<string, number>
  >({});
  const load = useCallback(async () => {
    try {
      const r = await axios.get("/api/orders");
      setOrders(r.data.orders || []);
      setReport(
        r.data.report || {
          totalAmount: 0,
          pendingAmount: 0,
          completedCount: 0,
        },
      );
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "دریافت سفارش‌ها انجام نشد."
          : "خطا",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const loadMethod = () => {
      void load();
    }
    loadMethod();
    const timer = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(timer);
  }, [load]);
  async function update(
    id: string,
    status: "received" | "paid",
    rating?: number,
  ) {
    setBusy(id);
    try {
      const r = await axios.patch(`/api/orders/${id}`, {
        status,
        ...(rating ? { rating } : {}),
      });
      toast.success(r.data.message);
      if (rating) setSelectedRatings((old) => ({ ...old, [id]: 0 }));
      await load();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "تغییر انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }
  async function remove(id: string) {
    if (!confirm("این سفارش از فهرست شما حذف شود؟")) return;
    try {
      await axios.delete(`/api/orders/${id}`);
      toast.success("سفارش از فهرست حذف شد.");
      setOrders((old) => old.filter((o) => o.id !== id));
    } catch (e) {
      toast.error(
        axios.isAxiosError(e) ? e.response?.data?.error || "حذف نشد." : "خطا",
      );
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-blue-700">حساب مشتری</p>
            <h1 className="mt-2 text-3xl font-bold">سفارش‌های من</h1>
            <p className="mt-2 text-slate-500">
              وضعیت درخواست‌ها، سابقه و گزارش هزینه‌های کرایه‌ات.
            </p>
          </div>
          <Link
            href="/items"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
          >
            <Store size={18} /> پیدا کردن جنس
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Report
            icon={<Wallet />}
            title="پرداخت‌های تکمیل‌شده"
            value={`${report.totalAmount.toLocaleString("fa-AF")} افغانی`}
          />
          <Report
            icon={<Clock3 />}
            title="مبلغ سفارش‌های باز"
            value={`${report.pendingAmount.toLocaleString("fa-AF")} افغانی`}
          />
          <Report
            icon={<CheckCircle2 />}
            title="معامله‌های تکمیل‌شده"
            value={report.completedCount.toLocaleString("fa-AF")}
          />
        </div>
        {loading ? (
          <p className="py-20 text-center text-slate-500">
            در حال بارگذاری سفارش‌ها…
          </p>
        ) : orders.length ? (
          <div className="mt-7 space-y-5">
            {orders.map((o) => (
              <article
                key={o.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold">
                      {o.shop?.name || "فروشگاه"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleString("fa-AF")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-2 text-sm font-bold ${styles[o.status]}`}
                    >
                      {labels[o.status]}
                    </span>
                    <button
                      onClick={() => void remove(o.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="حذف از فهرست"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {o.items.map((i) => (
                    <Link
                      key={i.itemId}
                      href={`/items/${i.itemId}`}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {i.image && (
                          <Image
                            src={i.image}
                            alt={i.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate">{i.name}</b>
                        <small className="text-slate-500">
                          {i.quantity} عدد × {i.days} روز
                        </small>
                      </span>
                      <span className="text-sm font-bold text-blue-800">
                        {i.lineTotal.toLocaleString("fa-AF")} افغانی
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-3 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold">
                    مجموع: {o.totalAmount.toLocaleString("fa-AF")} افغانی
                  </p>
                  {o.shop?.phone && (
                    <span className="text-sm text-slate-600">
                      تماس: <b dir="ltr">{o.shop.phone}</b>
                    </span>
                  )}
                  {o.status === "accepted" && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => void update(o.id, "received")}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {busy === o.id ? "در حال ثبت…" : "اجناس را دریافت کردم"}
                    </button>
                  )}
                  {o.status === "paid" && !o.rating && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold">
                        امتیاز به ارائه‌دهنده:
                      </span>
                      <div
                        className="flex items-center gap-1"
                        role="radiogroup"
                        aria-label="انتخاب امتیاز"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            type="button"
                            key={n}
                            title={`${n} ستاره`}
                            aria-pressed={selectedRatings[o.id] === n}
                            onClick={() =>
                              setSelectedRatings((old) => ({
                                ...old,
                                [o.id]: n,
                              }))
                            }
                            className={`rounded-md p-1 transition hover:scale-110 ${n <= (selectedRatings[o.id] || 0) ? "text-amber-500" : "text-slate-300"}`}
                          >
                            <Star
                              size={23}
                              fill={
                                n <= (selectedRatings[o.id] || 0)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-slate-500">
                        {selectedRatings[o.id]
                          ? `${selectedRatings[o.id]} از ۵`
                          : "یک امتیاز انتخاب کن"}
                      </span>
                      <button
                        type="button"
                        disabled={!selectedRatings[o.id] || busy === o.id}
                        onClick={() =>
                          void update(o.id, "paid", selectedRatings[o.id])
                        }
                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ثبت امتیاز
                      </button>
                    </div>
                  )}
                  {o.rating && (
                    <p className="text-sm font-bold text-amber-600">
                      امتیاز ثبت‌شدهٔ شما: {o.rating} از ۵ ⭐
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-white px-5 py-16 text-center">
            <ShoppingBag className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-xl font-bold">هنوز سفارشی ثبت نکرده‌ای</h2>
            <p className="mt-2 text-slate-500">
              از میان اجناس انتخاب کن و درخواست کرایه بفرست.
            </p>
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
function Report({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <span className="inline-flex rounded-xl bg-blue-50 p-2 text-blue-700">
        {icon}
      </span>
      <p className="mt-3 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <UserRouteAccess allow={["user"]}>
      <OrdersPageContent />
    </UserRouteAccess>
  );
}
