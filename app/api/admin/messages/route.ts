import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getAdminUser, getMasterAdmin } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import ContactMessage from "@/models/ContactMessageModel";
import type { LeanMessageRecord } from "@/types";

export async function GET() {
  try {
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    await connectDB();
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean<LeanMessageRecord[]>();
    return NextResponse.json({
      success: true,
      unreadCount: messages.filter((message) => message.status === "new")
        .length,
      messages: messages.map((message) => ({
        id: String(message._id),
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        status: message.status,
        createdAt: message.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "دریافت پیام‌ها انجام نشد." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      {
        success: false,
        error: "فقط مدیر کل اجازه حذف یا تغییر این بخش را دارد.",
      },
      { status: 403 },
    );
  try {
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    const parsed = z
      .object({
        id: z.string().refine((value) => mongoose.isValidObjectId(value)),
        status: z.enum(["read"]),
      })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "اطلاعات پیام معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const message = await ContactMessage.findByIdAndUpdate(
      parsed.data.id,
      { status: parsed.data.status },
      { new: true },
    );
    if (!message)
      return NextResponse.json(
        { success: false, error: "پیام پیدا نشد." },
        { status: 404 },
      );
    return NextResponse.json({
      success: true,
      message: "پیام به‌عنوان دیده‌شده ثبت شد.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "تغییر وضعیت پیام انجام نشد." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      {
        success: false,
        error: "فقط مدیر کل اجازه حذف یا تغییر این بخش را دارد.",
      },
      { status: 403 },
    );
  try {
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    const parsed = z
      .object({
        id: z.string().refine((value) => mongoose.isValidObjectId(value)),
      })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "شناسه پیام معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const deleted = await ContactMessage.findByIdAndDelete(parsed.data.id);
    if (!deleted)
      return NextResponse.json(
        { success: false, error: "پیام پیدا نشد." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, message: "پیام حذف شد." });
  } catch {
    return NextResponse.json(
      { success: false, error: "حذف پیام انجام نشد." },
      { status: 500 },
    );
  }
}
