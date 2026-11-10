import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import UserModel from "@/models/UserModel";
import { connectDB } from "@/ib/mongodb";
import { createToken } from "@/ib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await connectDB();
    const form = await request.formData();
    const parsed = schema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "ایمیل و رمز عبور معتبر وارد کنید." },
        { status: 400 },
      );
    const { email, password } = parsed.data;
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password)))
      return NextResponse.json(
        { success: false, error: "ایمیل یا رمز عبور اشتباه است." },
        { status: 401 },
      );
    if (user.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "حساب مدیران جدا است. از بخش ورود مدیران استفاده کنید.",
        },
        { status: 403 },
      );
    }
    const token = createToken(String(user._id));
    const response = NextResponse.json({
      success: true,
      message: "با موفقیت وارد شدید.",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
      },
    });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { success: false, error: "خطایی در ورود به حساب رخ داد." },
      { status: 500 },
    );
  }
}