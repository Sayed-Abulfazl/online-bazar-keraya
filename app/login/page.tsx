"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { z } from "zod";
import { LockKeyhole, LoaderCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { APP_NAME } from "@/constants";

const schema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    let active = true;
    axios
      .get("/api/auth/me")
      .then(async (r) => {
        if (!active || !r.data.user) return;
        const leave = window.confirm(
          "شما فعلاً داخل حساب هستید. آیا می‌خواهید خارج شوید و وارد صفحه ورود شوید؟",
        );
        if (leave) {
          await axios.post("/api/auth/logout");
          toast.success("از حساب خارج شدید.");
          window.location.reload();
          return;
        } else router.replace("/");
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "email" | "password";
        next[k] = issue.message;
      }
      setErrors(next);
      toast.error("ایمیل یا رمز عبور را بررسی کنید.");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = new FormData();
      data.append("email", form.email.trim());
      data.append("password", form.password);
      const response = await axios.post("/api/auth/login", data);
      toast.success(response.data.message || "با موفقیت وارد شدید.");
      router.push(
        response.data.user?.role === "admin"
          ? "/admin"
          : response.data.user?.role === "owner"
            ? "/owner/dashboard"
            : "/",
      );
      router.refresh();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "ایمیل یا رمز عبور اشتباه است."
          : "خطا در ورود",
      );
    } finally {
      setLoading(false);
    }
  }
  const input =
    "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
  return (
    <div className={`min-h-screen bg-slate-50`}>
      <Navbar />
      <main className="mx-auto flex max-w-lg flex-1 items-center px-4 py-14">
        <div className="w-full rounded-3xl border border-white bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <LockKeyhole size={26} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              خوش آمدید
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              برای ادامه وارد حساب {APP_NAME} شوید.
            </p>
          </div>
          {!checked ? (
            <p className="mt-6 text-center text-sm text-slate-400">
              در حال بررسی حساب…
            </p>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block text-sm font-bold">
                ایمیل <span className="text-red-600">*</span>
                <input
                  className={`${input} ${errors.email ? "border-red-400 bg-red-50" : ""}`}
                  type="text"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }));
                    setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="mt-1 block text-xs font-medium text-red-600">
                    {errors.email}
                  </span>
                )}
              </label>
              <label className="block text-sm font-bold">
                رمز عبور <span className="text-red-600">*</span>
                <input
                  className={`${input} ${errors.password ? "border-red-400 bg-red-50" : ""}`}
                  type="password"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }));
                    setErrors((x) => ({ ...x, password: undefined }));
                  }}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <span className="mt-1 block text-xs font-medium text-red-600">
                    {errors.password}
                  </span>
                )}
              </label>
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading && <LoaderCircle className="animate-spin" size={18} />}{" "}
                {loading ? "در حال ورود…" : "ورود به حساب"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            حساب ندارید؟{" "}
            <Link
              href="/register"
              className="font-bold text-blue-700 hover:underline"
            >
              ثبت‌ نام کنید
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
