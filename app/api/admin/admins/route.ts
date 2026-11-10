import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/ib/mongodb";
import { getMasterAdmin } from "@/ib/admin-auth";
import AdminModel from "@/models/AdminModel";
import type { LeanAdminRecord } from "@/types";

const createSchema = z.object({
  name: z.string().trim().min(2, "نام مدیر حداقل ۲ حرف باشد.").max(80),
  password: z.string().min(8, "رمز عبور حداقل ۸ حرف باشد.").max(100),
});
export async function GET() {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      { success: false, error: "فقط مدیر کل به فهرست مدیران دسترسی دارد." },
      { status: 403 },
    );
  await connectDB();
  const admins = await AdminModel.find()
    .select("name active createdAt")
    .sort({ createdAt: -1 })
    .lean<LeanAdminRecord[]>();
  return NextResponse.json({
    success: true,
    admins: admins.map((admin) => ({
      id: String(admin._id),
      name: admin.name,
      active: admin.active,
      createdAt: admin.createdAt,
    })),
  });
}
export async function POST(request: Request) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      { success: false, error: "فقط مدیر کل می‌تواند مدیر جدید بسازد." },
      { status: 403 },
    );
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "اطلاعات مدیر معتبر نیست.",
      },
      { status: 400 },
    );
  await connectDB();
  const name = parsed.data.name.trim();
  const masterName = process.env.ADMIN_NAME?.trim().toLowerCase();
  if (masterName && name.trim().toLowerCase() === masterName)
    return NextResponse.json(
      {
        success: false,
        error: "نام مدیر عادی نمی‌تواند با نام مدیر کل یکسان باشد.",
      },
      { status: 409 },
    );
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (
    await AdminModel.findOne({
      name: { $regex: `^${safeName}$`, $options: "i" },
    })
  )
    return NextResponse.json(
      { success: false, error: "این نام مدیر قبلاً استفاده شده است." },
      { status: 409 },
    );
  const password = await bcrypt.hash(parsed.data.password, 12);
  const admin = await AdminModel.create({ name, password, role: "admin" });
  return NextResponse.json(
    {
      success: true,
      message: "مدیر عادی ساخته شد.",
      admin: { id: String(admin._id), name: admin.name, active: admin.active },
    },
    { status: 201 },
  );
}
