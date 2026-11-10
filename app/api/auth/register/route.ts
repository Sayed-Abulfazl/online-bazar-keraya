import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";
import { connectDB } from "@/ib/mongodb";
import UserModel from "@/models/UserModel";
import { createToken } from "@/ib/auth";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants";

export const runtime = "nodejs";
const schema = z.object({
  name: z.string().trim().min(3, "نام باید حداقل ۳ حرف باشد.").max(100),
  phone: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ حرف باشد.").max(100),
  address: z.string().trim().min(3, "آدرس الزامی است.").max(300),
  role: z.enum(["user", "owner"]),
});
export async function POST(request: Request) {
  let uploadedProfileFileId = "";
  try {
    await connectDB();
    const form = await request.formData();
    const parsed = schema.safeParse({
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      password: form.get("password"),
      address: form.get("address"),
      role: form.get("role"),
    });

    if (!parsed.success)
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "معلومات معتبر نیست.",
        },
        { status: 400 },
      );
    const data = parsed.data;
    const duplicate = await UserModel.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });
    if (duplicate)
      return NextResponse.json(
        {
          success: false,
          error:
            duplicate.email === data.email
              ? "این ایمیل قبلاً ثبت شده است."
              : "این شماره قبلاً ثبت شده است.",
        },
        { status: 409 },
      );
    let profileImage = "";
    let profileImageFileId = "";
    const image = form.get("profileImage");
    if (!(image instanceof File) || image.size === 0)
      return NextResponse.json(
        { success: false, error: "عکس پروفایل الزامی است." },
        { status: 400 },
      );
    if (image instanceof File && image.size > 0) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(image.type))
        return NextResponse.json(
          { success: false, error: "فرمت عکس باید JPG، PNG یا WEBP باشد." },
          { status: 400 },
        );
      if (image.size > MAX_IMAGE_SIZE)
        return NextResponse.json(
          { success: false, error: "حجم عکس حداکثر ۲ مگابایت باشد." },
          { status: 400 },
        );
      const uploaded = await uploadImage(image, "profiles");
      profileImage = uploaded.url;
      profileImageFileId = uploaded.fileId;
      uploadedProfileFileId = uploaded.fileId;
    }
    const user = await UserModel.create({
      ...data,
      password: await bcrypt.hash(data.password, 12),
      profileImage,
      profileImageFileId,
    });
    // Admin is never assigned through public registration.
    const token = createToken(String(user._id));
    const response = NextResponse.json(
      {
        success: true,
        message: "حساب شما با موفقیت ساخته شد.",
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          address: user.address,
        },
      },
      { status: 201 },
    );
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
    if (uploadedProfileFileId) { try { await deleteImageFromImageKit(uploadedProfileFileId); } catch {} }
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { success: false, error: "خطایی در سرور رخ داد." },
      { status: 500 },
    );
  }
}
