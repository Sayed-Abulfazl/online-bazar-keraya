"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";
import axios from "axios";
import { APP_NAME } from "@/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const [stats, setStats] = useState({ customers: 0, owners: 0, items: 0 });

  useEffect(() => {
    axios
      .get("/api/public/stats")
      .then((r) =>
        setStats({
          customers: r.data.customers || 0,
          owners: r.data.owners || 0,
          items: r.data.items || 0,
        }),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="about-page min-h-screen bg-[#faf9f7] text-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute -left-32 top-40 h-80 w-80 rounded-full bg-orange-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-lg font-medium text-amber-700 shadow-sm">
                <Sparkles size={16} />
                درباره {APP_NAME}
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                اجاره کردن را
                <span className="block bg-linear-to-l from-amber-600 to-orange-500 bg-clip-text text-transparent">
                  ساده تر و مطمئن تر
                </span>
                میکنیم
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
                {APP_NAME} یک پلتفرم برای پیدا کردن و کرایه کردن وسایل مورد نیاز
                از فروشگاه ها و ارائه دهندگان خدمات کرایی است؛ جایی که مشتری
                راحت تر انتخاب میکند و صاحبان فروشگاه ها بهتر دیده میشوند.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="./items"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  مشاهده اجناس
                  <ArrowLeft size={18} />
                </a>

                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-800 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  تماس با ما
                </a>
              </div>
            </div>

            {/* Visual Card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-amber-200/40 to-orange-100/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-4xl border border-white bg-white p-2 shadow-2xl shadow-gray-900/10">
                <div className="rounded-[1.6rem] bg-linear-to-br from-gray-950 via-gray-900 to-gray-800 p-5 text-white sm:p-10">
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                      <Store size={28} />
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
                      Rental Marketplace
                    </span>
                  </div>

                  <div className="mt-10 sm:mt-16">
                    <p className="text-sm text-gray-400">هدف ما</p>
                    <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                      هر وسیله
                      <br />
                      در زمان مناسب
                    </h2>

                    <p className="mt-5 text-sm leading-7 text-gray-400">
                      ایجاد یک تجربه ساده، شفاف و حرفه ای برای مشتریان و ارائه
                      دهندگان وسایل کرایی.
                    </p>
                  </div>

                  <div className="mt-10 h-px bg-white/10" />

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{APP_NAME}</p>
                      <p className="mt-1 font-bold text-gray-200">
                        ساده، سریع، قابل اعتماد
                      </p>
                    </div>

                    <Sparkles className="text-amber-400" size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community statistics */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              مشتریان ثبت‌ نام‌ شده
            </p>
            <p className="mt-2 text-4xl font-bold text-amber-600">
              {stats.customers.toLocaleString("fa-AF")}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              ارائه‌ دهندگان ثبت‌ نام‌ شده
            </p>
            <p className="mt-2 text-4xl font-bold text-amber-600">
              {stats.owners.toLocaleString("fa-AF")}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-500">اجناس ثبت‌ شده</p>
            <p className="mt-2 text-4xl font-bold text-amber-600">
              {stats.items.toLocaleString("fa-AF")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-bold text-amber-600">
            چرا {APP_NAME}؟
          </span>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            تجربه ای بهتر برای هر دو طرف
          </h2>

          <p className="mt-5 leading-8 text-gray-600">
            ما تلاش میکنیم فرآیند پیدا کردن، انتخاب و کرایه وسایل را تا حد امکان
            ساده کنیم و در کنار آن، فرصت بیشتری برای دیده شدن فروشگاه های محلی
            فراهم کنیم.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Users size={24} />}
            title="بـرای مشتریان"
            description="وسایل مورد نیازتان را راحت تر پیدا کنید، مشخصات آنها را ببینید و از فروشگاه مورد نظر کرایه کنید."
          />

          <FeatureCard
            icon={<Store size={24} />}
            title="بـرای ارائه دهندگان"
            description="فروشگاه و وسایل کرایی خود را معرفی کنید و مشتریان بیشتری را با خدمات خود آشنا سازید."
          />

          <FeatureCard
            icon={<ShieldCheck size={24} />}
            title="تجربه شفاف"
            description="اطلاعات فروشگاه و وسایل در یک محیط منظم قرار میگیرد تا انتخاب برای مشتری آسانتر باشد."
          />
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="text-sm font-bold text-amber-600">
                ارزش های ما
              </span>

              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
                ساده بودن، اتفاقی نیست
              </h2>

              <p className="mt-5 leading-8 text-gray-600">
                {APP_NAME} با تمرکز روی تجربه کاربر ساخته میشود؛ از پیدا کردن
                فروشگاه گرفته تا انتخاب وسیله و ثبت درخواست کرایه.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "سادگی در استفاده",
                "اطلاعات واضح و منظم",
                "تجربه کاربری حرفهای",
                "توجه به نیاز فروشگاهها",
                "توسعه مرحله به مرحله",
                "تمرکز روی اعتماد کاربران",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-(--app-page) p-5"
                >
                  <CheckCircle2 size={20} className="shrink-0 text-amber-600" />
                  <span className="font-semibold text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="overflow-hidden rounded-4xl bg-gray-950 px-4 py-10 text-center sm:px-6 sm:py-14 text-white shadow-2xl">
          <Sparkles className="mx-auto text-amber-400" size={28} />

          <h2 className="mt-5 text-3xl font-medium sm:text-4xl">
            آماده پیدا کردن وسیله مورد نیازت هستی؟
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">
            فروشگاه های کرایی را ببین و گزینه مناسب خودت را پیدا کن.
          </p>

          <a
            href="./shops"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-7 py-3.5 font-bold text-gray-950 transition hover:bg-amber-400"
          >
            شروع جستجو
            <ArrowLeft size={18} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-bold text-gray-950">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
    </div>
  );
}
