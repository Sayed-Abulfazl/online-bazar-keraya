"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  APP_NAME,
  APP_TAGLINE,
  CUSTOMER_ROLE_LABEL,
  PROVIDER_LABEL,
  SHOP_LABEL_PLURAL,
} from "@/constants";

import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Store,
  ShoppingBag,
  UserRound,
  Settings2,
  Sun,
  Moon,
  LockKeyhole,
} from "lucide-react";

interface AdminNavSession {
  id: string;
  name: string;
  role: "master" | "admin";
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "owner";
  profileImage: string;
  address?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [adminSession, setAdminSession] = useState<AdminNavSession | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [dark, setDark] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const initialTheme = () => {
      const enabled = localStorage.getItem("ky-theme") === "dark";
      setDark(enabled);
      document.documentElement.classList.toggle("dark", enabled);
    };
    initialTheme();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("ky-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    toast.success(next ? "حالت شب فعال شد." : "حالت روز فعال شد.");
  };

  // Get current user

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        const current = response.data.user;
        setUser(current);
        if (current) {
          setAdminSession(null);
        } else {
          const adminResponse = await axios
            .get("/api/admin-auth/me")
            .catch(() => ({ data: { admin: null } }));
          setAdminSession(adminResponse.data.admin);
        }
      } catch {
        setUser(null);
        setAdminSession(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [pathname]);

  // Logout

  const handleLogout = async () => {
    try {
      const response = await axios.post("/api/auth/logout");

      setUser(null);
      setProfileOpen(false);
      setMobileOpen(false);

      router.push("/");
      router.refresh();
      toast.success(response.data.message);
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
  };

  const handleAdminLogout = async () => {
    try {
      const response = await axios.post("/api/admin-auth/logout");
      setAdminSession(null);
      setMobileOpen(false);
      router.push("/");
      router.refresh();
      toast.success(response.data.message);
    } catch {
      toast.error("خروج مدیر انجام نشد.");
    }
  };

  const getRoleName = () => {
    if (!user) return "";

    if (user.role === "owner") {
      return PROVIDER_LABEL;
    }

    return CUSTOMER_ROLE_LABEL;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Store size={21} />
          </div>

          <div>
            <h1 className="text-xl text-gray-900 font-semibold">{APP_NAME}</h1>

            <p className="text-[14px] text-gray-500 font-semibold">
              {APP_TAGLINE}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-5 lg:flex">
          <Link
            href="/"
            className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            {"خانه"}
          </Link>

          <Link
            href="/shops"
            className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            {SHOP_LABEL_PLURAL}
          </Link>

          <Link
            href="/items"
            className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            {"اجناس"}
          </Link>

          <Link
            href="/about"
            className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            {"درباره ما"}
          </Link>

          {!adminSession && (!user || user.role === "user") && (
            <Link
              href="/cart"
              className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
            >
              {"سبد انتخاب‌ ها"}
            </Link>
          )}

          <Link
            href="/contact"
            className="text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            {"تماس با ما"}
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 text-lg font-medium text-gray-900 transition hover:text-blue-600"
          >
            <Settings2 size={16} /> {"تنظیمات"}
          </button>
        </nav>

        {/* Desktop User */}
        <div className="hidden items-center gap-3 lg:flex">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : adminSession ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                aria-label={"پنل مدیران"}
                className="inline-flex max-w-52 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-blue-800"
              >
                <span className="max-w-28 truncate text-sm font-bold">
                  {adminSession.name}
                </span>
                {adminSession.role !== "master" && (
                  <span className="whitespace-nowrap rounded-md bg-blue-100 px-2 py-1 text-[10px] font-semibold">
                    {"مدیر"}
                  </span>
                )}
              </Link>
              <button
                onClick={handleAdminLogout}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {"خروج"}
              </button>
            </div>
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                {"ورود"}
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {"ثبت نام"}
              </Link>
              <Link
                href="/admin-login"
                title={"ورود مدیران"}
                aria-label={"ورود مدیران"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <LockKeyhole size={18} />
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 transition hover:bg-gray-50"
              >
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User size={18} />
                  </div>
                )}

                <div className="text-right">
                  <p className="max-w-28 truncate text-lg font-semibold text-gray-900">
                    {user.name}
                  </p>

                  <p className="text-sm text-gray-900">{getRoleName()}</p>
                </div>

                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100"
                  >
                    <UserRound size={18} />
                    {"پروفایل من"}
                  </Link>

                  {user.role === "user" && (
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      <ShoppingBag size={18} /> {"سفارش‌ های من"}
                    </Link>
                  )}

                  {user.role === "owner" && (
                    <Link
                      href="/owner/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      <Store size={18} />
                      پنل {PROVIDER_LABEL}
                    </Link>
                  )}

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    {"خروج از حساب"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {"خانه"}
            </Link>

            <Link
              href="/shops"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {SHOP_LABEL_PLURAL}
            </Link>

            <Link
              href="/items"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {"اجناس"}
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {"درباره ما"}
            </Link>

            {!adminSession && (!user || user.role === "user") && (
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                {"سبد انتخاب‌ ها"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 text-right`}
            >
              <Settings2 size={18} /> {"تنظیمات"}
            </button>

            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              {"تماس با ما"}
            </Link>
          </nav>

          <div className="my-3 border-t border-gray-100" />

          {adminSession ? (
            <div className="space-y-2 rounded-xl bg-blue-50 p-3">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 font-bold text-blue-800"
              >
                <span className="truncate">{adminSession.name}</span>
                {adminSession.role !== "master" && (
                  <span className="rounded-md bg-blue-100 px-2 py-1 text-[10px] font-semibold">
                    {"مدیر"}
                  </span>
                )}
              </Link>
              <button
                onClick={handleAdminLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
              >
                <LogOut size={16} /> {"خروج از پنل مدیر"}
              </button>
            </div>
          ) : !user ? (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-900"
              >
                {"ورود"}
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                {"ثبت نام"}
              </Link>
              <Link
                href="/admin-login"
                title={"ورود مدیران"}
                aria-label={"ورود مدیران"}
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              >
                <LockKeyhole size={18} />
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.name}
                    width={42}
                    height={42}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User size={18} />
                  </div>
                )}

                <div>
                  <p className="font-semibold text-lg text-gray-900">{user.name}</p>

                  <p className="text-sm text-gray-900">{getRoleName()}</p>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-900 hover:bg-gray-100"
              >
                <UserRound size={18} />
                {"پروفایل من"}
              </Link>

              {user.role === "user" && (
                <Link
                  href="/dashboard/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-900 hover:bg-gray-100"
                >
                  <ShoppingBag size={18} /> {"سفارش‌ های من"}
                </Link>
              )}

              {user.role === "owner" && (
                <Link
                  href="/owner/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-900 hover:bg-gray-100"
                >
                  <Store size={18} />
                  {"پنل ارائه دهنده"}
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                {"خروج از حساب"}
              </button>
            </div>
          )}
        </div>
      )}

      {settingsOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/45 px-4 py-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSettingsOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-modal-title"
              dir="rtl"
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Settings2 size={22} />
                  </div>
                  <h2
                    id="settings-modal-title"
                    className="text-xl font-semibold text-gray-900"
                  >
                    تـنظـیـمات
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-900">
                    تم مورد دلخواه خود را انتخاب کنید.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="بستن تنظیمات"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      {dark ? <Moon size={20} /> : <Sun size={20} />}
                    </span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        حالت نمایش
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {dark ? "حالت شب فعال است" : "حالت روز فعال است"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dark}
                    onClick={toggleTheme}
                    dir="ltr"
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${dark ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${dark ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
              بستن
              </button>
            </section>
          </div>,
          document.body,
        )}
    </header>
  );
}
