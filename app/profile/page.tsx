"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserRouteAccess } from "@/components/RouteAccess";

const profileFormSchema = z.object({
  name: z.string().trim().min(3, "نام باید حداقل ۳ حرف باشد.").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست."),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
  address: z.string().trim().min(3, "آدرس باید حداقل ۳ حرف باشد.").max(300),
  password: z
    .string()
    .refine((v) => !v || v.length >= 8, "رمز عبور باید حداقل ۸ حرف باشد."),
});
type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "owner" | "admin";
  profileImage: string;
  address: string;
  earnings?: number;
  averageRating?: number;
  ratingCount?: number;
};
function ProfilePageContent() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    axios
      .get("/api/profile")
      .then((r) => {
        const u = r.data.user as Profile;
        setUser(u);
        setForm({
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          address: u.address || "",
          password: "",
        });
      })
      .catch(() => {
        toast.error("برای دیدن پروفایل ابتدا وارد شوید.");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);
  function change(key: keyof typeof form, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const checked = profileFormSchema.safeParse(form);
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
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k !== "password" || v) data.append(k, v);
    });
    if (image) data.append("profileImage", image);
    setSaving(true);
    try {
      const r = await axios.patch("/api/profile", data);
      setUser({
        ...r.data.user,
        earnings: user?.earnings,
        averageRating: user?.averageRating,
        ratingCount: user?.ratingCount,
      });
      setForm((f) => ({ ...f, password: "" }));
      setImage(null);
      setPreview("");
      toast.success(r.data.message);
      router.refresh();
    } catch (e) {
      toast.error(
        axios.isAxiosError(e)
          ? e.response?.data?.error || "ذخیره انجام نشد."
          : "خطا در ذخیره",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteAccount() {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("برای تأیید حذف، رمز عبور خود را وارد کنید.");
      return;
    }
    setDeleting(true);
    try {
      await axios.delete("/api/profile", {
        data: { password: deletePassword },
      });
      toast.success("حساب کاربری با موفقیت حذف شد.");
      setDeleteModal(false);
      router.replace("/");
      router.refresh();
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? e.response?.data?.error || "حذف حساب انجام نشد."
        : "خطا";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }
  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-7 flex flex-row justify-between items-center">
          <div>
            <p className="text-sm font-bold text-blue-700">حساب کاربری</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              پروفایل من
            </h1>
            <p className="mt-2 text-slate-500">
              معلومات حساب خود را مدیریت کنید.
            </p>
          </div>
          <div>
            <button className="cursor-pointer me-6" onClick={() => router.back()}>
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            در حال بارگذاری…
          </div>
        ) : (
          user && (
            <form
              noValidate
              onSubmit={submit}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8"
            >
              <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700">
                  {preview ? (
                    <Image
                      width={100}
                      height={100}
                      src={preview}
                      alt="پیش‌ نمایش"
                      className="h-full w-full object-cover"
                    />
                  ) : user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={36} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {user.role === "admin"
                      ? "مدیر"
                      : user.role === "owner"
                        ? "ارائه‌ دهنده"
                        : "مشتری"}
                  </p>
                  {user.role === "owner" && (
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800">
                        مجموع دریافتی:{" "}
                        {Number(user.earnings || 0).toLocaleString("fa-AF")}{" "}
                        افغانی
                      </span>
                      <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-bold text-amber-800">
                        امتیاز:{" "}
                        {user.ratingCount
                          ? Number(user.averageRating || 0).toFixed(1)
                          : "بدون امتیاز"}{" "}
                        {user.ratingCount
                          ? `از ۵ · ${user.ratingCount} رأی`
                          : ""}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50"
                  >
                    <Camera size={16} /> تغییر عکس
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (
                        f.size === 0 ||
                        f.size > 2 * 1024 * 1024 ||
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          f.type,
                        )
                      ) {
                        toast.error(
                          "عکس باید JPG، PNG یا WEBP و حداکثر ۲ مگابایت باشد.",
                        );
                        e.target.value = "";
                        return;
                      }
                      setImage(f);
                      setPreview(URL.createObjectURL(f));
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  نام کامل
                  <input
                    className={`${inputClass} ${fieldErrors.name ? "border-red-400 bg-red-50" : ""}`}
                    value={form.name}
                    onChange={(e) => {
                      change("name", e.target.value);
                      setFieldErrors((x) => ({ ...x, name: "" }));
                    }}
                  />
                  {fieldErrors.name && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors.name}
                    </span>
                  )}
                </label>
                <label className="text-sm font-bold">
                  ایمیل
                  <input
                    className={`${inputClass} ${fieldErrors.email ? "border-red-400 bg-red-50" : ""}`}
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => {
                      change("email", e.target.value);
                      setFieldErrors((x) => ({ ...x, email: "" }));
                    }}
                  />
                  {fieldErrors.email && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors.email}
                    </span>
                  )}
                </label>
                <label className="text-sm font-bold">
                  شماره تماس
                  <input
                    className={`${inputClass} ${fieldErrors.phone ? "border-red-400 bg-red-50" : ""}`}
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => {
                      change("phone", e.target.value);
                      setFieldErrors((x) => ({ ...x, phone: "" }));
                    }}
                  />
                  {fieldErrors.phone && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors.phone}
                    </span>
                  )}
                </label>
                <label className="text-sm font-bold">
                  آدرس
                  <input
                    className={`${inputClass} ${fieldErrors.address ? "border-red-400 bg-red-50" : ""}`}
                    value={form.address}
                    onChange={(e) => {
                      change("address", e.target.value);
                      setFieldErrors((x) => ({ ...x, address: "" }));
                    }}
                  />
                  {fieldErrors.address && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors.address}
                    </span>
                  )}
                </label>
                <label className="text-sm font-bold sm:col-span-2">
                  رمز عبور جدید{" "}
                  <span className="font-normal text-slate-400">
                    (اگر نمی‌خواهید تغییر دهید، خالی بگذارید)
                  </span>
                  <input
                    className={`${inputClass} ${fieldErrors.password ? "border-red-400 bg-red-50" : ""}`}
                    type="password"
                    value={form.password}
                    onChange={(e) => {
                      change("password", e.target.value);
                      setFieldErrors((x) => ({ ...x, password: "" }));
                    }}
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {fieldErrors.password}
                    </span>
                  )}
                </label>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
                </button>
                {user.role !== "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePassword("");
                      setDeleteError("");
                      setDeleteModal(true);
                    }}
                    disabled={deleting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-6 py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 size={18} />
                    {deleting ? "در حال حذف…" : "حذف حساب من"}
                  </button>
                )}
              </div>
            </form>
          )
        )}
        {deleteModal && (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 p-4"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !deleting)
                setDeleteModal(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex flex-row-reverse justify-between items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Trash2 size={24} />
                </div>
                <h2
                  id="delete-account-title"
                  className="text-xl font-bold text-slate-900"
                >
                  تأیید حذف حساب
                </h2>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                این اقدام برگشت‌ ناپذیر است و مراکز کرایی، اجناس و اطلاعات
                وابسته به حساب شما نیز حذف خواهند شد. برای ادامه، رمز عبور خود
                را وارد کنید.
              </p>
              <label className="mt-5 block text-sm font-bold">
                رمز عبور فعلی
                <input
                  autoFocus
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError("");
                  }}
                  autoComplete="current-password"
                  className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:ring-4 focus:ring-red-500/10 ${deleteError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`}
                  dir="ltr"
                />
              </label>
              {deleteError && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {deleteError}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void deleteAccount()}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "در حال حذف…" : "تأیید و حذف حساب"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <UserRouteAccess allow={["user", "owner"]}>
      <ProfilePageContent />
    </UserRouteAccess>
  );
}
