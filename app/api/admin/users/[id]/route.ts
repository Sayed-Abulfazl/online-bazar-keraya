import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminUser, getMasterAdmin } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import { deleteImageFromImageKit } from "@/ib/imagekit";
import UserModel from "@/models/UserModel";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import OrderModel from "@/models/OrderModel";
import type { LeanUserRecord } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const admin = await getAdminUser();
  if (!admin)
    return NextResponse.json(
      { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
      { status: 403 },
    );
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json(
      { success: false, error: "شناسه معتبر نیست." },
      { status: 400 },
    );
  await connectDB();
  const user = (await UserModel.findById(id).select("-password").lean<LeanUserRecord | null>());
  if (!user)
    return NextResponse.json(
      { success: false, error: "کاربر پیدا نشد." },
      { status: 404 },
    );
  const shops = await ShopModel.find({ owner: user._id })
    .select("name address phone image createdAt")
    .lean();
  const items = await ItemModel.find({ owner: user._id })
    .select("name image priceDaily shop createdAt")
    .populate("shop", "name")
    .lean();
  return NextResponse.json({
    success: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage || "",
      address: user.address || "",
      createdAt: user.createdAt,
    },
    shops,
    items,
  });
}

export async function DELETE(_request: Request, context: Ctx) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      {
        success: false,
        error: "فقط مدیر کل اجازه حذف یا تغییر این بخش را دارد.",
      },
      { status: 403 },
    );
  try {
    const admin = await getAdminUser();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const user = await UserModel.findById(id);
    if (!user)
      return NextResponse.json(
        { success: false, error: "کاربر پیدا نشد." },
        { status: 404 },
      );
    if (user.role === "admin")
      return NextResponse.json(
        { success: false, error: "حساب مدیر قابل حذف از این بخش نیست." },
        { status: 403 },
      );
    const shops = await ShopModel.find({ owner: user._id }).select("_id imageFileId");
    const ids = shops.map((shop) => shop._id);
    const items = await ItemModel.find({ $or: [{ owner: user._id }, { shop: { $in: ids } }] }).select("imageFileId");
    await Promise.all([
      ...shops.map((shop) => deleteImageFromImageKit(shop.imageFileId)),
      ...items.map((item) => deleteImageFromImageKit(item.imageFileId)),
    ]);
    await OrderModel.deleteMany({
      $or: [
        { customer: user._id },
        { owner: user._id },
        { shop: { $in: ids } },
      ],
    });
    await ItemModel.deleteMany({
      $or: [{ owner: user._id }, { shop: { $in: ids } }],
    });
    await ShopModel.deleteMany({ owner: user._id });
    await deleteImageFromImageKit(user.profileImageFileId);
    await UserModel.findByIdAndDelete(user._id);
    return NextResponse.json({
      success: true,
      message: "کاربر و فروشگاه‌ها و اجناس مرتبط حذف شدند.",
    });
  } catch (error) {
    console.error("ADMIN DELETE USER:", error);
    return NextResponse.json(
      { success: false, error: "حذف کاربر انجام نشد." },
      { status: 500 },
    );
  }
}
