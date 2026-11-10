import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/ib/mongodb";
import { createAdminToken } from "@/ib/admin-auth";
import AdminModel from "@/models/AdminModel";

const schema = z.object({
  identifier: z.string().trim().min(2).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "نام مدیر و رمز عبور را وارد کنید." },
        { status: 400 },
      );
    const { identifier, password } = parsed.data;
    const masterName = process.env.ADMIN_NAME?.trim().toLowerCase();
    const masterPassword = process.env.ADMIN_PASSWORD;
    let session: { id: string; name: string; role: "master" | "admin" };

    if (
      masterName &&
      masterPassword &&
      identifier.trim().toLowerCase() === masterName &&
      password === masterPassword
    ) {
      session = {
        id: "master",
        name: process.env.ADMIN_NAME!.trim(),
        role: "master",
      };
    } else {
      await connectDB();
      const admin = await AdminModel.findOne({
        name: identifier,
        active: true,
      }).select("+password name active");
      if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return NextResponse.json(
          { success: false, error: "اطلاعات ورود مدیر معتبر نیست." },
          { status: 401 },
        );
      }
      session = { id: String(admin._id), name: admin.name, role: "admin" };
    }

    const response = NextResponse.json({
      success: true,
      admin: session,
      message: "ورود مدیر موفق بود.",
    });
    response.cookies.set("admin_token", createAdminToken(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("ADMIN LOGIN:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ورود مدیر انجام نشد. تنظیمات سرور را بررسی کنید.",
      },
      { status: 500 },
    );
  }
}
