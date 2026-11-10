"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock3,
  Store,
  PackagePlus,
  Wallet,
  Star,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserRouteAccess } from "@/components/RouteAccess";
type ShopOwnerSummary = { id?: string; ownerId?: string; owner?: string };
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
  shop: { id: string; name: string } | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  totalDaily: number;
  totalAmount: number;
};
const labels: Record<Order["status"], string> = {
  pending: "در انتظار بررسی",
  accepted: "در انتظار رسیدن اجناس",
  rejected: "رد شده",
  received: "در انتظار تأیید پرداخت",
  paid: "پرداخت تأیید شد",
};
function OwnerDashboardPageContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [ownShopId, setOwnShopId] = useState("");
  const [report, setReport] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    completedCount: 0,
  });
  const load = useCallback(async () => {
    try {
      const [me, r, shopsResponse] = await Promise.all([
        axios.get("/api/auth/me"),
        axios.get("/api/orders"),
        axios.get("/api/shops"),
      ]);
      if (me.data.user?.role !== "owner") {
        toast.error("این صفحه مخصوص ارائه‌ دهنده است.");
        router.replace("/");
        return;
      }
      setOrders(r.data.orders || []);
      setReport(
        r.data.report || {
          totalAmount: 0,
          pendingAmount: 0,
          completedCount: 0,
        },
      );
      const mine = (shopsResponse.data.shops || []).find(
        (s: ShopOwnerSummary) =>
          String(s.ownerId) === String(me.data.user.id || me.data.user._id),
      );
      setOwnShopId(mine?.id || "");
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "دریافت سفارش‌ها انجام نشد."
          : "خطا",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    const loadMethod = () => {
      void load();
    };
    loadMethod();
    const timer = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(timer);
  }, [load]);
  async function update(id: string, status: "accepted" | "rejected" | "paid") {
    setBusy(id);
    try {
      const r = await axios.patch(`/api/orders/${id}`, { status });
      toast.success(r.data.message);
      await load();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "تغییر وضعیت انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }
  async function remove(id: string) {
    if (!confirm("این سفارش از فهرست شما حذف شود؟")) return;
    setBusy(id);
    try {
      await axios.delete(`/api/orders/${id}`);
      toast.success("سفارش از فهرست حذف شد.");
      setOrders((old) => old.filter((o) => o.id !== id));
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "حذف انجام نشد."
          : "خطا",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-blue-700">پنل ارائه‌ دهنده</p>
            <h1 className="mt-2 text-3xl font-bold">مدیریت سفارش‌ ها</h1>
            <p className="mt-2 text-slate-500">
              درخواست‌ها را بررسی کن و پس از دریافت اجناس توسط مشتری، پرداخت را
              تأیید کن.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ownShopId ? (
              <>
                <Link
                  href={`/shops/${ownShopId}`}
                  className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-bold"
                >
                  <Store size={18} />
                  مرکز کرایه من
                </Link>
                <Link
                  href={`/items/new?shopId=${ownShopId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
                >
                  <PackagePlus size={18} />
                  ثبت جنس جدید
                </Link>
              </>
            ) : (
              <Link
                href="/shops"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
              >
                <Store size={18} />
                ثبت مرکز کرایه
              </Link>
            )}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Report
            icon={<Wallet />}
            title="مجموع دریافتی‌های تأیید شده"
            value={`${report.totalAmount.toLocaleString("fa-AF")} افغانی`}
          />
          <Report
            icon={<Clock3 />}
            title="مبلغ سفارش‌های باز"
            value={`${report.pendingAmount.toLocaleString("fa-AF")} افغانی`}
          />
          <Report
            icon={<CheckCircle2 />}
            title="معامله‌های تکمیل‌ شده"
            value={report.completedCount.toLocaleString("fa-AF")}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {(["pending", "accepted", "received", "paid"] as const).map((s) => (
            <div key={s} className="rounded-2xl border bg-white p-4">
              <p className="text-sm text-slate-500">{labels[s]}</p>
              <p className="mt-2 text-2xl font-bold">
                {orders.filter((o) => o.status === s).length}
              </p>
            </div>
          ))}
        </div>
        {loading ? (
          <p className="py-20 text-center text-slate-500">در حال بارگذاری…</p>
        ) : orders.length ? (
          <div className="mt-6 space-y-5">
            {orders.map((o) => (
              <article
                key={o.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold">
                      درخواست از {o.customerName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      شماره تماس: <b dir="ltr">{o.customerPhone}</b>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      آدرس: {o.customerAddress}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleString("fa-AF")}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
                    {labels[o.status]}
                  </span>
                </div>
                <div className="divide-y">
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
                      <span className="flex-1">
                        <b className="block">{i.name}</b>
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
                  <div className="flex flex-wrap gap-2">
                    {o.status === "pending" && (
                      <>
                        <button
                          disabled={busy === o.id}
                          onClick={() => void update(o.id, "accepted")}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
                        >
                          <CheckCircle2 size={16} /> پذیرش
                        </button>
                        <button
                          disabled={busy === o.id}
                          onClick={() => void update(o.id, "rejected")}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
                        >
                          <XCircle size={16} /> رد درخواست
                        </button>
                      </>
                    )}
                    {o.status === "received" && (
                      <button
                        disabled={busy === o.id}
                        onClick={() => void update(o.id, "paid")}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <PackageCheck size={16} /> پول را دریافت کردم
                      </button>
                    )}
                    {o.status === "paid" && (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                        <Star size={16} fill="currentColor" /> امتیاز مشتری:{" "}
                        {o.rating || "هنوز امتیاز نداده"}
                      </span>
                    )}
                    <button
                      disabled={busy === o.id}
                      onClick={() => void remove(o.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={16} /> حذف از فهرست
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-white px-5 py-16 text-center">
            <ClipboardList className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-xl font-bold">درخواستی ثبت نشده است</h2>
            <p className="mt-2 text-slate-500">
              وقتی مشتری از مرکز شما درخواست کرایه کند، اینجا نمایش داده میشود.
            </p>
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

export default function OwnerDashboardPage() {
  return (
    <UserRouteAccess allow={["owner"]}>
      <OwnerDashboardPageContent />
    </UserRouteAccess>
  );
}
