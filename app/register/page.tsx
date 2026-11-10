"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { z } from "zod";
import { UserRound, Store, User, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_NAME, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants";
import Image from "next/image";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "نام باید حداقل ۳ حرف باشد.")
    .max(100, "نام نباید بیشتر از ۱۰۰ حرف باشد."),
  phone: z
    .string()
    .trim()
    .min(1, "شماره تماس الزامی است.")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    )
    .max(30, "شماره تماس معتبر نیست."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("ایمیل معتبر نیست.")
    .max(200, "ایمیل بیش از حد طولانی است."),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ حرف باشد.")
    .max(100, "رمز عبور بیش از حد طولانی است."),
  address: z
    .string()
    .trim()
    .min(3, "آدرس الزامی است و باید حداقل ۳ حرف باشد.")
    .max(300, "آدرس نباید بیشتر از ۳۰۰ حرف باشد."),
});

type Form = z.infer<typeof schema>;
type Field = keyof Form;

const labels: Record<Field, string> = {
  name: "نام کامل",
  phone: "شماره تماس",
  email: "ایمیل",
  password: "رمز عبور",
  address: "آدرس",
};

export default function RegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<"user" | "owner">("user");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<Field | "profileImage", string>>
  >({});

  const [form, setForm] = useState<Form>({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
  });

  const input =
    "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  useEffect(() => {
    let active = true;
    axios
      .get("/api/auth/me")
      .then(async (r) => {
        if (!active || !r.data.user) return;
        const leave = window.confirm(
          "شما فعلاً داخل حساب هستید. برای رفتن به ثبت‌ نام، از حساب خارج شوید؟",
        );
        if (leave) {
          await axios.post("/api/auth/logout");
          toast.success("از حساب خارج شدید.");
          window.location.reload();
          return;
        } else {
          router.replace("/");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckedSession(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  function update(k: Field, v: string) {
    setForm((old) => ({ ...old, [k]: v }));
    setErrors((old) => ({ ...old, [k]: undefined }));
  }

  function validateImage(file: File | null) {
    if (!file) return "عکس پروفایل الزامی است.";
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type))
      return "فرمت عکس باید JPG، PNG یا WEBP باشد.";
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE)
      return "حجم عکس باید حداکثر ۲ مگابایت باشد.";
    return "";
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const parsed = schema.safeParse(form);
    const next: Partial<Record<Field | "profileImage", string>> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        if (!next[key]) next[key] = issue.message;
      }
    const imageError = validateImage(image);
    if (imageError) next.profileImage = imageError;
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("لطفاً خطاهای سرخ‌رنگ فورم را اصلاح کنید.");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      if (parsed.success) Object.entries(parsed.data).forEach(([k, v]) => data.append(k, v));
      data.append("role", role);
      data.append("profileImage", image as File);
      const response = await axios.post("/api/auth/register", data);
      toast.success(response.data.message || "حساب ساخته شد.");
      router.push(role === "owner" ? "/shops" : "/");
      router.refresh();
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? e.response?.data?.error || "ثبت ‌نام انجام نشد."
        : "خطا در ثبت‌ نام.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
  if (!checkedSession)
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <p className="py-24 text-center text-slate-500">در حال بررسی حساب…</p>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <UserRound size={27} />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            ایجاد حساب در {APP_NAME}
          </h1>
          <p className="mt-2 text-slate-500">
            نوع حساب را انتخاب کنید و معلومات خود را وارد نمایید.
          </p>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8"
        >
          <div className="mb-7 grid grid-cols-2 gap-3">
            {(
              [
                {
                  key: "user",
                  title: "مشتری",
                  desc: "پیدا کردن و کرایه وسایل",
                  icon: <User />,
                },
                {
                  key: "owner",
                  title: "ارائه‌ دهنده",
                  desc: "ساخت مرکز کرایه و ثبت اجناس",
                  icon: <Store />,
                },
              ] as const
            ).map((x) => (
              <button
                type="button"
                key={x.key}
                onClick={() => setRole(x.key)}
                className={`rounded-2xl border p-4 text-right transition ${role === x.key ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="flex items-center gap-2 font-bold">
                  {x.icon}
                  {x.title}
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  {x.desc}
                </span>
              </button>
            ))}
          </div>
          <div className="mb-7 flex flex-col items-center rounded-2xl bg-slate-50 px-4 py-5 text-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-blue-700 shadow-md ring-1 ring-slate-200"
            >
              {preview ? (
                <Image
                  width={100}
                  height={100}
                  src={preview}
                  alt="پیش‌ نمایش عکس پروفایل"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={40} />
              )}
            </button>
            <p className="mt-3 font-bold text-slate-800">
              عکس پروفایل <span className="text-red-600">*</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              JPG، PNG یا WEBP — حداکثر ۲ مگابایت
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50"
            >
              انتخاب عکس
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                const err = validateImage(f);
                if (err) {
                  setErrors((old) => ({ ...old, profileImage: err }));
                  toast.error(err);
                  e.currentTarget.value = "";
                  return;
                }
                setImage(f);
                if (f) setPreview(URL.createObjectURL(f));
                setErrors((old) => ({ ...old, profileImage: undefined }));
              }}
            />
            {errors.profileImage && (
              <p className="mt-2 text-sm font-medium text-red-600">
                {errors.profileImage}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name", "phone", "email", "password", "address"] as Field[]).map(
              (field) => (
                <label
                  key={field}
                  className={`block text-sm font-bold text-slate-700 ${field === "email" || field === "password" || field === "address" ? "sm:col-span-2" : ""}`}
                >
                  {labels[field]} <span className="text-red-600">*</span>
                  <input
                    className={`${input} ${errors[field] ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}`}
                    value={form[field]}
                    onChange={(e) => update(field, e.target.value)}
                    type={
                      field === "email"
                        ? "text"
                        : field === "password"
                          ? "password"
                          : "text"
                    }
                    dir={
                      field === "email" ||
                      field === "phone" ||
                      field === "password"
                        ? "ltr"
                        : "rtl"
                    }
                    autoComplete={
                      field === "password"
                        ? "new-password"
                        : field === "email"
                          ? "email"
                          : "off"
                    }
                    placeholder={field === "phone" ? "07XXXXXXXX" : ""}
                  />
                  {errors[field] && (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {errors[field]}
                    </span>
                  )}
                </label>
              ),
            )}
          </div>
          <button
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <LoaderCircle className="animate-spin" size={18} />}{" "}
            {loading ? "در حال ثبت…" : "ایجاد حساب"}
          </button>
          <p className="mt-5 text-center text-sm text-slate-500">
            قبلاً حساب ساخته‌ اید؟ {" "}
            <Link
              href="/login"
              className="font-bold text-blue-700 hover:underline"
            >
              وارد شوید
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
