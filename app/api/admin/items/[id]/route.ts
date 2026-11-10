import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAdminUser, getMasterAdmin } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import { deleteImageFromImageKit } from "@/ib/imagekit";
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
        { success: false, error: "شناسه جنس معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const item = await ItemModel.findById(id);
    if (!item)
      return NextResponse.json(
        { success: false, error: "جنس پیدا نشد." },
        { status: 404 },
      );
    await OrderModel.updateMany(
      { "items.item": item._id },
      { $pull: { items: { item: item._id } } },
    );
    await OrderModel.deleteMany({ items: { $size: 0 } });
    await ItemModel.findByIdAndDelete(id);
    try { await deleteImageFromImageKit(item.imageFileId); } catch (cleanupError) { console.error("ADMIN ITEM IMAGE CLEANUP:", cleanupError); }
    return NextResponse.json({ success: true, message: "جنس حذف شد." });
  } catch {
    return NextResponse.json(
      { success: false, error: "حذف جنس انجام نشد." },
      { status: 500 },
    );
  }
}
