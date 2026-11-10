"use client";
import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_NAME } from "@/constants";

const contactSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد.").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست.").max(200),
  subject: z.string().trim().min(2, "موضوع باید حداقل ۲ حرف باشد.").max(150),
  message: z
    .string()
    .trim()
    .min(10, "پیام باید حداقل ۱۰ حرف باشد.")
    .max(3000, "پیام بیش از حد طولانی است."),
});
export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const checked = contactSchema.safeParse(form);
    if (!checked.success) {
      const next: Record<string, string> = {};
      checked.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "");
        if (key && !next[key]) next[key] = issue.message;
      });
      // while data not equal with schema, success is false and errors is in checked.error.issues and each item of array of issues has 2 property: path[] is array and name of field is path[0] and message
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const r = await axios.post("/api/contact", form);
      toast.success(r.data.message);
      setForm({ name: "", email: "", subject: "", message: "" });
      setFieldErrors({});
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? e.response?.data?.error || "ارسال پیام انجام نشد."
        : "خطا در ارسال پیام";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
  const input =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";
  
    return (
    <div className="contact-page min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-14 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <MessageCircle size={16} /> ارتباط با {APP_NAME}
          </span>
          <h1 className="mt-5 text-4xl font-medium sm:text-5xl">
            با ما در ارتباط باشید
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-500">
            سوال، پیشنهاد یا مشکلی دارید؟ پیام خود را بفرستید؛ پیام شما در سیستم
            ثبت می‌شود.
          </p>
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="rounded-3xl bg-slate-950 p-5 text-white sm:p-9">
          <p className="font-bold text-blue-400">اطلاعات تماس</p>
          <h2 className="mt-3 text-3xl font-medium">
            خوشحال می‌شویم صدای شما را بشنویم.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            برای سوالات، پیشنهادها و همکاری با ما در تماس باشید.
          </p>
          <div className="mt-9 space-y-5">
            <Contact
              icon={<Phone />}
              title="شماره تماس"
              value="۰۰۹۳۷۹۶۷۰۸۹۴۴"
            />
            <Contact
              icon={<Mail />}
              title="ایمیل"
              value="bazarkeraya@gmail.com"
            />
            <Contact icon={<MapPin />} title="موقعیت" value="افغانستان - بلخ" />
          </div>
        </aside>
        <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-9">
          <h2 className="text-2xl font-medium">ارسال پیام</h2>
          <p className="mt-2 text-sm text-slate-500">
            لطفاً معلومات را کامل و درست وارد کنید.
          </p>
          {error && (
            <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                نام شما
                <input
                  className={`mt-2 ${input} ${fieldErrors.name ? "border-red-400 bg-red-50" : ""}`}
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setFieldErrors((x) => ({ ...x, name: "" }));
                  }}
                  required
                  minLength={2}
                  maxLength={100}
                />
                {fieldErrors.name && (
                  <span className="mt-1 block text-xs font-medium text-red-600">
                    {fieldErrors.name}
                  </span>
                )}
              </label>
              <label className="text-sm font-semibold">
                ایمیل
                <input
                  className={`mt-2 ${input} ${fieldErrors.email ? "border-red-400 bg-red-50" : ""}`}
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, email: e.target.value }));
                    setFieldErrors((x) => ({ ...x, email: "" }));
                  }}
                  required
                  maxLength={200}
                />
                {fieldErrors.email && (
                  <span className="mt-1 block text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </span>
                )}
              </label>
            </div>
            <label className="block text-sm font-semibold">
              موضوع
              <input
                className={`mt-2 ${input} ${fieldErrors.subject ? "border-red-400 bg-red-50" : ""}`}
                value={form.subject}
                onChange={(e) => {
                  setForm((f) => ({ ...f, subject: e.target.value }));
                  setFieldErrors((x) => ({ ...x, subject: "" }));
                }}
                required
                minLength={2}
                maxLength={150}
              />
              {fieldErrors.subject && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {fieldErrors.subject}
                </span>
              )}
            </label>
            <label className="block text-sm font-semibold">
              محتوای پیام
              <textarea
                className={`mt-2 ${input} resize-y ${fieldErrors.message ? "border-red-400 bg-red-50" : ""}`}
                rows={6}
                value={form.message}
                onChange={(e) => {
                  setForm((f) => ({ ...f, message: e.target.value }));
                  setFieldErrors((x) => ({ ...x, message: "" }));
                }}
                required
                minLength={10}
                maxLength={3000}
              />
              <span className="mt-1 block text-left text-xs font-normal text-slate-400">
                {form.message.length}/3000
              </span>
              {fieldErrors.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {fieldErrors.message}
                </span>
              )}
            </label>
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}{" "}
              {loading ? "در حال ارسال…" : "ارسال پیام"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Contact({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-400">
        {icon}
      </span>
      <div>
        <p className="text-xs text-slate-400">{title}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    </div>
  );
}
