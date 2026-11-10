import { NextResponse } from "next/server";
import { getAdminUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import OrderModel from "@/models/OrderModel";
import type { LeanOrderRecord } from "@/types";

function totalOf(order: LeanOrderRecord) {
  return (order.items || []).reduce(
    (sum: number, item: LeanOrderRecord["items"][number]) =>
      sum +
      Number(item.priceDaily || 0) *
        Number(item.quantity || 1) *
        Number(item.days || 1),
    0,
  );
}

export async function GET() {
  try {
    if (!(await getAdminUser())) {
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    }
    await connectDB();
    const orders = await OrderModel.find()
      .populate("shop", "name address")
      .populate("customer", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .lean<LeanOrderRecord[]>();

    const mapped = orders.map((order) => ({
      id: String(order._id),
      status: order.status,
      createdAt: order.createdAt,
      shop: order.shop?.name || "فروشگاه حذف‌شده",
      shopAddress: order.shop?.address || "",
      customerAddress: order.customerAddress || "",
      customer: order.customer?.name || order.customerName || "کاربر حذف‌شده",
      customerEmail: order.customer?.email || "",
      owner: order.owner?.name || "ارائه‌دهنده حذف‌شده",
      items: (order.items || []).map(
        (item: LeanOrderRecord["items"][number]) => ({
          name: item.name,
          quantity: item.quantity || 1,
          days: item.days || 1,
        }),
      ),
      totalAmount: totalOf(order),
    }));

    const paid = mapped.filter((order) => order.status === "paid");
    const sum = (list: typeof mapped) =>
      list.reduce((total, order) => total + order.totalAmount, 0);
    return NextResponse.json({
      success: true,
      orders: mapped,
      report: {
        totalOrders: mapped.length,
        pendingCount: mapped.filter((order) => order.status === "pending")
          .length,
        acceptedCount: mapped.filter((order) => order.status === "accepted")
          .length,
        rejectedCount: mapped.filter((order) => order.status === "rejected")
          .length,
        paidCount: paid.length,
        paidAmount: sum(paid),
        pendingAmount: sum(
          mapped.filter((order) =>
            ["pending", "accepted", "received"].includes(order.status),
          ),
        ),
        rejectedAmount: sum(
          mapped.filter((order) => order.status === "rejected"),
        ),
      },
    });
  } catch (error) {
    console.error("ADMIN ORDERS:", error);
    return NextResponse.json(
      { success: false, error: "گزارش سفارش‌ها دریافت نشد." },
      { status: 500 },
    );
  }
}
