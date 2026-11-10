import Link from "next/link";
import type { ReactNode } from "react";
import {
  APP_NAME,
  APP_TAGLINE,
  SOCIAL_LINKS,
  SHOP_LABEL_PLURAL,
} from "@/constants";

import {
  Send,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Store
} from "lucide-react";

const socialItems = [
  {
    label: "WhatsApp",
    href: SOCIAL_LINKS.whatsapp,
    icon: MessageCircle,
    hover: "hover:bg-emerald-600",
  },
  {
    label: "Telegram",
    href: SOCIAL_LINKS.telegram,
    icon: Send,
    hover: "hover:bg-sky-500",
  },
  // { label: "Facebook", href: SOCIAL_LINKS.facebook, icon: Facebook, hover: "hover:bg-blue-600" },
  // { label: "YouTube", href: SOCIAL_LINKS.youtube, icon: Youtube, hover: "hover:bg-red-600" },
  // { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: Instagram, hover: "hover:bg-pink-600" },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                <Store size={21} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">{APP_NAME}</h2>
                <p className="text-xs text-gray-400">{APP_TAGLINE}</p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-7 text-gray-400">
              {APP_NAME} فضایی ساده برای پیدا کردن وسایل مورد نیاز و درخواست
              کرایه از ارائه‌ دهندگان است. آدرس و شرایط را بررسی کنید و با
              اطمینان بیشتری تصمیم بگیرید.
            </p>
            <div
              className="mt-6 flex flex-wrap items-center gap-3"
              aria-label="شبکه‌های اجتماعی"
            >
              {socialItems.map(({ label, href, icon: Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  target={href === "#" ? undefined : "_blank"}
                  rel={href === "#" ? undefined : "noreferrer noopener"}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 text-gray-200 transition ${hover}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-medium text-white">دسترسی سریع</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 transition hover:text-white"
                >
                  صفحهٔ اصلی
                </Link>
              </li>
              <li>
                <Link
                  href="/shops"
                  className="text-gray-400 transition hover:text-white"
                >
                  {SHOP_LABEL_PLURAL}
                </Link>
              </li>
              <li>
                <Link
                  href="/items"
                  className="text-gray-400 transition hover:text-white"
                >
                  اجناس کرایی
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 transition hover:text-white"
                >
                  دربارهٔ ما
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 transition hover:text-white"
                >
                  تماس با ما
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 font-medium text-white">حساب و دسترسی</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/register"
                  className="text-gray-400 transition hover:text-white"
                >
                  ایجاد حساب کاربری
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-400 transition hover:text-white"
                >
                  ورود کاربران
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-gray-400 transition hover:text-white"
                >
                  پروفایل من
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/dashboard"
                  className="text-gray-400 transition hover:text-white"
                >
                  پنل ارائه‌ دهنده
                </Link>
              </li>
              <li>
                <Link
                  href="/admin-login"
                  className="inline-flex items-center gap-2 text-gray-400 transition hover:text-white"
                >
                  <ShieldCheck size={15} /> ورود مدیران
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Contact
              icon={<Phone size={17} />}
              title="شماره تماس"
              value="۰۰۹۳۷۹۶۷۰۸۹۴۴"
            />
            <Contact
              icon={<Mail size={17} />}
              title="ایمیل"
              value="bazarkeraya@gmail.com"
            />
            <Contact
              icon={<MapPin size={17} />}
              title="موقعیت"
              value="افغانستان - بلخ"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-center md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {APP_NAME} — تمامی حقوق محفوظ است.
          </p>
          <p className="text-sm text-gray-500">
            ساخته‌ شده برای ساده‌ تر شدن کرایهٔ وسایل و تجهیزات.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Contact({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-sm text-gray-300">{value}</p>
      </div>
    </div>
  );
}
