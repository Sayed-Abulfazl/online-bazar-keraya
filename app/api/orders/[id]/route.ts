import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import OrderModel from "@/models/OrderModel";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "ابتدا وارد حساب شوید." },
        { status: 401 },
      );
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه سفارش معتبر نیست." },
        { status: 400 },
      );
    const parsed = z
      .object({
        status: z.enum(["accepted", "rejected", "received", "paid"]),
        rating: z.number().int().min(1).max(5).optional(),
      })
      .safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "اطلاعات تغییر وضعیت معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const filter =
      user.role === "owner"
        ? { _id: id, owner: user._id }
        : { _id: id, customer: user._id };
    const order = await OrderModel.findOne(filter);
    if (!order)
      return NextResponse.json(
        { success: false, error: "سفارش پیدا نشد یا اجازه ندارید." },
        { status: 404 },
      );
    const next = parsed.data.status;
    const allowed =
      user.role === "owner"
        ? (order.status === "pending" &&
            ["accepted", "rejected"].includes(next)) ||
          (order.status === "received" && next === "paid")
        : (order.status === "accepted" && next === "received") ||
          (order.status === "paid" &&
            next === "paid" &&
            parsed.data.rating !== undefined &&
            order.rating == null);
    if (!allowed)
      return NextResponse.json(
        { success: false, error: "این تغییر در مرحله فعلی سفارش مجاز نیست." },
        { status: 409 },
      );
    order.status = next;
    if (parsed.data.rating !== undefined) {
      if (user.role !== "user" || order.status !== "paid")
        return NextResponse.json(
          { success: false, error: "امتیاز پس از تکمیل پرداخت ثبت می‌شود." },
          { status: 400 },
        );
      order.rating = parsed.data.rating;
      order.ratedAt = new Date();
    }
    await order.save();
    const messages: Record<string, string> = {
      accepted: "درخواست پذیرفته شد.",
      rejected: "درخواست رد شد.",
      received: "دریافت اجناس ثبت شد؛ منتظر تأیید پرداخت ارائه‌دهنده باشید.",
      paid: "پرداخت تأیید شد.",
    };
    return NextResponse.json({
      success: true,
      message: messages[next] || "تغییر ذخیره شد.",
    });
  } catch (e) {
    console.error("ORDER PATCH", e);
    return NextResponse.json(
      { success: false, error: "تغییر وضعیت انجام نشد." },
      { status: 500 },
    );
  }
}
export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "ابتدا وارد حساب شوید." },
        { status: 401 },
      );
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه سفارش معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    if (user.role === "admin")
      return NextResponse.json(
        { success: false, error: "مدیر از این مسیر سفارش را حذف نمی‌کند." },
        { status: 403 },
      );
    const isOwner = user.role === "owner";
    const filter = isOwner
      ? { _id: id, owner: user._id }
      : { _id: id, customer: user._id };
    const order = await OrderModel.findOneAndUpdate(
      filter,
      { $set: isOwner ? { hiddenByOwner: true } : { hiddenByCustomer: true } },
      { new: true },
    );
    if (!order)
      return NextResponse.json(
        { success: false, error: "سفارش پیدا نشد یا اجازه حذف آن را ندارید." },
        { status: 404 },
      );
    return NextResponse.json({
      success: true,
      message: "سفارش فقط از فهرست شما پنهان شد؛ سابقه در سیستم باقی است.",
    });
  } catch (e) {
    console.error("ORDER DELETE", e);
    return NextResponse.json(
      { success: false, error: "حذف سفارش انجام نشد." },
      { status: 500 },
    );
  }
}
