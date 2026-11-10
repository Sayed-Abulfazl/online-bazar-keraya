"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { ShieldCheck, ArrowRight, LoaderCircle } from "lucide-react";
import { APP_NAME } from "@/constants";

const loginSchema = z.object({
  identifier: z.string().trim().min(2, "نام مدیر را وارد کنید."),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ حرف باشد."),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = loginSchema.safeParse({ identifier, password });
    if (!checked.success) {
      const next: { identifier?: string; password?: string } = {};
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if ((key === "identifier" || key === "password") && !next[key])
          next[key] = issue.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setServerError("");
    setBusy(true);
    try {
      const response = await axios.post("/api/admin-auth/login", {
        identifier: identifier.trim(),
        password,
      });
      toast.success(response.data.message || "ورود موفق بود.");
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setServerError(
        axios.isAxiosError(error)
          ? error.response?.data?.error || "ورود مدیر انجام نشد."
          : "خطایی رخ داد.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900">
          ورود مدیران
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          برای ورود نام و رمز عبور خود را وارد کنید.
        </p>
        <form onSubmit={submit} noValidate className="mt-7 space-y-5">
          <label className="block text-sm font-bold text-slate-700">
            <input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((old) => ({ ...old, identifier: undefined }));
                setServerError("");
              }}
              autoComplete="username"
              className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${errors.identifier ? "border-red-400 bg-red-50" : "border-slate-200"}`}
              placeholder="نام مدیر"
            />
            {errors.identifier && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {errors.identifier}
              </span>
            )}
          </label>
          <label className="block text-sm font-bold text-slate-700">
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((old) => ({ ...old, password: undefined }));
                setServerError("");
              }}
              autoComplete="current-password"
              className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${errors.password ? "border-red-400 bg-red-50" : "border-slate-200"}`}
              placeholder="رمز عبور"
            />
            {errors.password && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {errors.password}
              </span>
            )}
          </label>
          {serverError && (
            <p className="rounded-xl border border-red-200 bg-red-100 p-3 text-sm font-medium text-red-700">
              {serverError}
            </p>
          )}
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}{" "}
            ورود به پنل مدیران
          </button>
        </form>
        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700"
          >
            <ArrowRight size={16} /> برگشت به {APP_NAME}
          </Link>
        </div>
      </section>
    </main>
  );
}
