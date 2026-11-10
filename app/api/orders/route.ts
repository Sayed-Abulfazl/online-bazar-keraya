import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getCurrentUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import ItemModel from "@/models/ItemModel";
import ShopModel from "@/models/ShopModel";
import OrderModel from "@/models/OrderModel";
import type { LeanOrderRecord, LeanItemRecord } from "@/types";

const lineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100),
  days: z.coerce.number().int().min(1).max(365),
});
const createSchema = z.object({ items: z.array(lineSchema).min(1).max(100) });

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "ابتدا وارد حساب شوید." },
        { status: 401 },
      );
    if (user.role === "admin")
      return NextResponse.json({ success: true, orders: [] });
    await connectDB();
    const filter =
      user.role === "owner" ? { owner: user._id } : { customer: user._id };
    const orders = await OrderModel.find(filter)
      .populate("shop", "name phone address image")
      .sort({ createdAt: -1 })
      .lean<LeanOrderRecord[]>();
    const mapped = orders.map((o) => {
      const total = o.items.reduce(
        (sum: number, i: LeanOrderRecord["items"][number]) =>
          sum + i.priceDaily * (i.quantity || 1) * (i.days || 1),
        0,
      );
      return {
        id: String(o._id),
        status: o.status,
        rating: o.rating ?? null,
        hiddenByCustomer: Array.isArray(o.hiddenByCustomer)
          ? o.hiddenByCustomer.length > 0
          : Boolean(o.hiddenByCustomer),
        hiddenByOwner: Array.isArray(o.hiddenByOwner)
          ? o.hiddenByOwner.length > 0
          : Boolean(o.hiddenByOwner),
        items: o.items.map((i: LeanOrderRecord["items"][number]) => ({
          itemId: String(i.item),
          name: i.name,
          image: i.image,
          priceDaily: i.priceDaily,
          quantity: i.quantity || 1,
          days: i.days || 1,
          lineTotal: i.priceDaily * (i.quantity || 1) * (i.days || 1),
        })),
        shop: o.shop
          ? {
              id: String(o.shop._id),
              name: o.shop.name,
              phone: o.shop.phone,
              address: o.shop.address,
              image: o.shop.image,
            }
          : null,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        createdAt: o.createdAt,
        totalDaily: o.items.reduce(
          (s: number, i: LeanOrderRecord["items"][number]) =>
            s + i.priceDaily * (i.quantity || 1),
          0,
        ),
        totalAmount: total,
      };
    });
    const visibleOrders = mapped.filter((order: (typeof mapped)[number]) =>
      user.role === "owner" ? !order.hiddenByOwner : !order.hiddenByCustomer,
    );
    const completed = mapped.filter((o) => o.status === "paid");
    const totalPaid = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    return NextResponse.json({
      success: true,
      orders: visibleOrders,
      report: {
        completedCount: completed.length,
        totalAmount: totalPaid,
        pendingAmount: mapped
          .filter((o) => o.status !== "rejected" && o.status !== "paid")
          .reduce((sum, o) => sum + o.totalAmount, 0),
      },
    });
  } catch (e) {
    console.error("ORDERS GET", e);
    return NextResponse.json(
      { success: false, error: "دریافت سفارش‌ها انجام نشد." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "برای سفارش دادن ابتدا وارد حساب شوید." },
        { status: 401 },
      );
    if (user.role !== "user")
      return NextResponse.json(
        { success: false, error: "ثبت سفارش فقط برای حساب مشتری است." },
        { status: 403 },
      );
    await connectDB();
    if (!String(user.address || "").trim())
      return NextResponse.json(
        {
          success: false,
          error: "پیش از سفارش، آدرس خود را در پروفایل ثبت کنید.",
        },
        { status: 400 },
      );
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "تعداد و روز هر جنس را درست انتخاب کنید." },
        { status: 400 },
      );
    const unique = new Map<string, { quantity: number; days: number }>();
    for (const line of parsed.data.items) {
      if (!mongoose.isValidObjectId(line.itemId))
        return NextResponse.json(
          { success: false, error: "شناسه یکی از اجناس معتبر نیست." },
          { status: 400 },
        );
      unique.set(line.itemId, line);
    }
    const ids = [...unique.keys()];
    const found = await ItemModel.find({ _id: { $in: ids } })
      .populate("shop", "name owner")
      .lean<LeanItemRecord[]>();
    if (found.length !== ids.length)
      return NextResponse.json(
        { success: false, error: "بعضی از اجناس دیگر در دسترس نیستند." },
        { status: 404 },
      );
    const groups = new Map<string, LeanItemRecord[]>();
    for (const item of found) {
      if (!item.shop)
        return NextResponse.json(
          { success: false, error: `جنس «${item.name}» فعلاً در دسترس نیست.` },
          { status: 400 },
        );
      const key = String(item.shop._id);
      groups.set(key, [...(groups.get(key) || []), item]);
    }
    const created: string[] = [];
    for (const [shopId, group] of groups) {
      const shop = await ShopModel.findById(shopId);
      if (!shop) continue;
      const orderItems = group.map((i) => {
        const line = unique.get(String(i._id))!;
        return {
          item: i._id,
          name: i.name,
          image: i.image,
          priceDaily: i.priceDaily,
          quantity: line.quantity,
          days: line.days,
        };
      });
      const order = await OrderModel.create({
        customer: user._id,
        owner: shop.owner,
        shop: shop._id,
        items: orderItems,
        customerName: user.name,
        customerPhone: user.phone,
        customerAddress: user.address,
      });
      created.push(String(order._id));
    }
    return NextResponse.json(
      {
        success: true,
        message: `درخواست کرایه برای ${created.length} فروشگاه ثبت شد.`,
        orderIds: created,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("ORDERS POST", e);
    return NextResponse.json(
      { success: false, error: "ثبت سفارش انجام نشد." },
      { status: 500 },
    );
  }
}
