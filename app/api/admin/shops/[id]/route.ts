import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminUser, getMasterAdmin } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import { deleteImageFromImageKit } from "@/ib/imagekit";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import OrderModel from "@/models/OrderModel";
type Ctx = { params: Promise<{ id: string }> };
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
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه فروشگاه معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const shop = await ShopModel.findById(id);
    if (!shop)
      return NextResponse.json(
        { success: false, error: "فروشگاه پیدا نشد." },
        { status: 404 },
      );
    await OrderModel.deleteMany({ shop: shop._id });
    const items = await ItemModel.find({ shop: shop._id }).select("imageFileId");
    await Promise.all(items.map((item) => deleteImageFromImageKit(item.imageFileId)));
    await deleteImageFromImageKit(shop.imageFileId);
    await ItemModel.deleteMany({ shop: shop._id });
    await ShopModel.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "فروشگاه و اجناس آن حذف شدند.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "حذف فروشگاه انجام نشد." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Ctx) {
  if (!(await getMasterAdmin()))
    return NextResponse.json(
      { success: false, error: "فقط مدیر کل اجازه تغییر دارد." },
      { status: 403 },
    );
  try {
    if (!(await getAdminUser()))
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه فروشگاه معتبر نیست." },
        { status: 400 },
      );
    const body = await request.json();
    if (body.reject === true) {
      const shop = await ShopModel.findById(id);
      if (!shop)
        return NextResponse.json(
          { success: false, error: "فروشگاه پیدا نشد." },
          { status: 404 },
        );
      await OrderModel.deleteMany({ shop: shop._id });
      const items = await ItemModel.find({ shop: shop._id }).select("imageFileId");
      await Promise.all(items.map((item) => deleteImageFromImageKit(item.imageFileId)));
      await deleteImageFromImageKit(shop.imageFileId);
      await ItemModel.deleteMany({ shop: shop._id });
      await ShopModel.findByIdAndDelete(id);
      return NextResponse.json({
        success: true,
        message: "درخواست فروشگاه رد و حذف شد.",
      });
    }
    if (typeof body.active !== "boolean")
      return NextResponse.json(
        { success: false, error: "وضعیت فعال معتبر نیست." },
        { status: 400 },
      );
    const shop = await ShopModel.findByIdAndUpdate(
      id,
      { active: body.active },
      { new: true },
    );
    if (!shop)
      return NextResponse.json(
        { success: false, error: "فروشگاه پیدا نشد." },
        { status: 404 },
      );
    return NextResponse.json({
      success: true,
      message: body.active ? "فروشگاه تأیید و فعال شد." : "فروشگاه غیرفعال شد.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "تغییر وضعیت فروشگاه انجام نشد." },
      { status: 500 },
    );
  }
}
