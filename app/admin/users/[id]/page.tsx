"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Store, Package } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { AdminRouteAccess } from "@/components/RouteAccess";
import type { AdminUserDetailResponse } from "@/types";

function AdminUserDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/admin/users/${params.id}`)
      .then((r) => setData(r.data as AdminUserDetailResponse))
      .catch((e) => {
        toast.error(
          axios.isAxiosError(e)
            ? e.response?.data?.error || "کاربر پیدا نشد."
            : "خطا",
        );
        router.replace("/admin");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-bold text-blue-700">
            برگشت به پنل مدیریت
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-700">
            مشاهده سایت
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-9">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowRight size={17} /> برگشت به مدیریت
        </Link>
        {loading ? (
          <p className="p-12 text-center">در حال بارگذاری…</p>
        ) : (
          data && (
            <>
              <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4">
                  {data.user.profileImage ? (
                    <Image
                      src={data.user.profileImage}
                      alt=""
                      width={88}
                      height={88}
                      className="h-22 w-22 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-22 w-22 items-center justify-center rounded-full bg-violet-50 text-3xl font-bold text-violet-700">
                      {data.user.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">{data.user.name}</h1>
                    <p className="mt-1 text-slate-500">
                      {data.user.role === "owner" ? "ارائه‌دهنده" : "مشتری"}
                    </p>
                  </div>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <Info title="ایمیل" value={data.user.email || ""} />
                  <Info title="شماره تماس" value={data.user.phone || ""} />
                  <Info title="آدرس" value={data.user.address || "ثبت نشده"} />
                  <Info
                    title="تاریخ ثبت‌نام"
                    value={new Date(data.user.createdAt).toLocaleDateString(
                      "fa-AF",
                    )}
                  />
                </div>
              </section>
              <section className="mt-6 rounded-3xl border bg-white p-6">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Store size={20} /> فروشگاه‌های کاربر ({data.shops.length})
                </h2>
                {data.shops.length ? (
                  data.shops.map((s) => (
                    <div key={s._id} className="mt-4 rounded-xl border p-4">
                      <p className="font-bold">{s.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {s.address} · {s.phone}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    فروشگاهی ثبت نشده است.
                  </p>
                )}
              </section>
              <section className="mt-6 rounded-3xl border bg-white p-6">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Package size={20} /> اجناس کاربر ({data.items.length})
                </h2>
                {data.items.length ? (
                  data.items.map((i) => (
                    <div key={i._id} className="mt-4 rounded-xl border p-4">
                      <p className="font-bold">{i.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {i.shop?.name || "بدون فروشگاه"} · قیمت روزانه:{" "}
                        {i.priceDaily}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    جنسی ثبت نشده است.
                  </p>
                )}
              </section>
            </>
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-2 wrap-break-word font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AdminUserDetailPage() {
  return (
    <AdminRouteAccess>
      <AdminUserDetailPageContent />
    </AdminRouteAccess>
  );
}
