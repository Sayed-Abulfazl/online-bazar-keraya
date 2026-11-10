import { NextResponse } from "next/server";
import { getAdminUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import type { LeanShopRecord, LeanItemRecord } from "@/types";
export async function GET() {
  try {
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    await connectDB();
    const [shopsResult, itemsResult] = await Promise.all([
      ShopModel.find()
        .sort({ createdAt: -1 })
        .populate("owner", "name email")
        .lean<LeanShopRecord[]>(),
      ItemModel.find()
        .sort({ createdAt: -1 })
        .populate("shop", "name")
        .populate("owner", "name email")
        .lean<LeanItemRecord[]>(),
    ]);
    const shops = shopsResult;
    const items = itemsResult;
    return NextResponse.json({
      success: true,
      shops: shops.map((s) => ({
        id: String(s._id),
        active: s.active === true,
        name: s.name,
        description: s.description || "",
        address: s.address,
        image: s.image,
        owner: s.owner?.name || "—",
        ownerId: s.owner?._id ? String(s.owner._id) : "",
      })),
      items: items.map((i) => ({
        id: String(i._id),
        name: i.name,
        description: i.description || "",
        image: i.image,
        priceDaily: i.priceDaily,
        shop: i.shop?.name || "—",
        owner: i.owner?.name || "—",
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "گرفتن اطلاعات انجام نشد." },
      { status: 500 },
    );
  }
}
