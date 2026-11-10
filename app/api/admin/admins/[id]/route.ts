import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/ib/mongodb";
import { getMasterAdmin } from "@/ib/admin-auth";
import AdminModel from "@/models/AdminModel";
type Context = { params: Promise<{ id: string }> };
type AdminStatusBody = { active?: unknown };

export async function PATCH(request: Request, context: Context) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      {
        success: false,
        error: "فقط مدیر کل می‌تواند وضعیت مدیران را تغییر دهد.",
      },
      { status: 403 },
    );
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json(
      { success: false, error: "شناسه مدیر معتبر نیست." },
      { status: 400 },
    );
  let body: AdminStatusBody;
  try {
    body = (await request.json()) as AdminStatusBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "درخواست معتبر نیست." },
      { status: 400 },
    );
  }
  if (typeof body.active !== "boolean")
    return NextResponse.json(
      { success: false, error: "وضعیت انتخاب‌شده معتبر نیست." },
      { status: 400 },
    );
  await connectDB();
  const admin = await AdminModel.findByIdAndUpdate(
    id,
    { active: body.active },
    { new: true },
  ).select("name active");
  if (!admin)
    return NextResponse.json(
      { success: false, error: "مدیر پیدا نشد." },
      { status: 404 },
    );
  return NextResponse.json({
    success: true,
    message: body.active ? "دسترسی مدیر فعال شد." : "دسترسی مدیر غیرفعال شد.",
    admin: { id: String(admin._id), name: admin.name, active: admin.active },
  });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      { success: false, error: "فقط مدیر کل می‌تواند مدیران را حذف کند." },
      { status: 403 },
    );
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json(
      { success: false, error: "شناسه مدیر معتبر نیست." },
      { status: 400 },
    );
  await connectDB();
  const removed = await AdminModel.findByIdAndDelete(id);
  if (!removed)
    return NextResponse.json(
      { success: false, error: "مدیر پیدا نشد." },
      { status: 404 },
    );
  return NextResponse.json({ success: true, message: "مدیر حذف شد." });
}
