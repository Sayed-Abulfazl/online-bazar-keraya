"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

type UserRole = "user" | "owner";

export function UserRouteAccess({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const allowKey = allow.join(",");
  useEffect(() => {
    let active = true;
    const allowedRoles = allowKey.split(",");
    axios.get("/api/auth/me").then(async (response) => {
      const user = response.data.user;
      if (!user) {
        const adminResponse = await axios.get("/api/admin-auth/me").catch(() => ({ data: { admin: null } }));
        if (adminResponse.data.admin) {
          toast.error("این بخش برای حساب مدیران نیست.");
          router.replace("/admin");
          return;
        }
        toast.error("برای دیدن این بخش ابتدا وارد حساب خود شوید.");
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!allowedRoles.includes(user.role)) {
        toast.error(allowedRoles.includes("owner") ? "این بخش مخصوص ارائه‌دهندگان است." : "این بخش مخصوص مشتریان است.");
        router.replace(user.role === "owner" ? "/owner/dashboard" : "/");
        return;
      }
      if (active) setReady(true);
    }).catch(() => {
      toast.error("برای دیدن این بخش ابتدا وارد حساب خود شوید.");
      router.replace("/login");
    });
    return () => { active = false; };
  }, [allowKey, pathname, router]);
  if (!ready) return <div className="flex min-h-[45vh] items-center justify-center text-sm text-slate-500">در حال بررسی دسترسی…</div>;
  return <>{children}</>;
}

export function AdminRouteAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    axios.get("/api/admin-auth/me").then((response) => {
      if (!response.data.admin) {
        toast.error("برای ورود به این بخش، از صفحه ورود مدیران استفاده کنید.");
        router.replace("/admin-login");
        return;
      }
      if (active) setReady(true);
    }).catch(() => router.replace("/admin-login"));
    return () => { active = false; };
  }, [router]);
  if (!ready) return <div className="flex min-h-[45vh] items-center justify-center text-sm text-slate-500">در حال بررسی دسترسی مدیر…</div>;
  return <>{children}</>;
}
