import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/ib/mongodb";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import OrderModel from "@/models/OrderModel";
import { getCurrentUser } from "@/ib/server-auth";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه مرکز کرایه معتبر نیست." },
        { status: 400 },
      );
    await connectDB();
    const shop = await ShopModel.findOne({ _id: id })
      .populate("owner", "name")
      .lean();
    if (!shop)
      return NextResponse.json(
        { success: false, error: "مرکز کرایه پیدا نشد." },
        { status: 404 },
      );
    if (shop.active !== true) {
      const current = await getCurrentUser();
      if (
        !current ||
        String(current._id) !== String(shop.owner?._id || shop.owner)
      )
        return NextResponse.json(
          { success: false, error: "مرکز کرایه هنوز تأیید نشده است." },
          { status: 404 },
        );
    }
    const items = await ItemModel.find({ shop: shop._id })
      .sort({ createdAt: -1 })
      .lean();
    const ownerId = shop.owner?._id || shop.owner;

    const ratings = await OrderModel.find({
      owner: ownerId,
      shop: shop._id,
      status: "paid",
      rating: { $ne: null },
    })
      .select("rating")
      .lean();

    const paidOrders = await OrderModel.find({
      owner: ownerId,
      shop: shop._id,
      status: "paid",
    })
      .select("items")
      .lean();

    const averageRating = ratings.length
      ? ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        ratings.length
      : 0;

    const totalReceived = paidOrders.reduce(
      (sum, o) =>
        sum +
        o.items.reduce(
          (lineSum: number, i : {
            priceDaily? : number | string;
            quantity? : number | string;
            days? : number | string;
          }) =>
            lineSum +
            Number(i.priceDaily || 0) *
              Number(i.quantity || 1) *
              Number(i.days || 1),
          0,
        ),
      0,
    );
    
    return NextResponse.json({
      success: true,
      shop: {
        id: String(shop._id),
        name: shop.name,
        description: shop.description,
        image: shop.image,
        address: shop.address,
        phone: shop.phone,
        ownerName: shop.owner?.name || "",
        ownerId: shop.owner?._id ? String(shop.owner._id) : "",
        averageRating,
        ratingCount: ratings.length,
        totalReceived,
      },
      items: items.map((i) => ({
        id: String(i._id),
        name: i.name,
        description: i.description,
        image: i.image,
        priceDaily: i.priceDaily,
        shopId: String(i.shop),
        ownerId: String(i.owner),
      })),
    });
  } catch (error) {
    console.error("SHOP DETAIL:", error);
    return NextResponse.json(
      { success: false, error: "دریافت مرکز کرایه انجام نشد." },
      { status: 500 },
    );
  }
}

const shopUpdateSchema = z.object({
  name: z.string().trim().min(2, "نام مرکز کرایه حداقل ۲ حرف باشد.").max(100),
  description: z.string().trim().max(1000).optional().default(""),
  address: z.string().trim().min(2, "آدرس الزامی است.").max(300),
  phone: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
});

export async function PATCH(request: Request, context: Ctx) {
  let oldImageFileId = "";
  let newImageFileId = "";
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { success: false, error: "ابتدا وارد حساب شوید." },
        { status: 401 },
      );

    if (user.role !== "owner")
      return NextResponse.json(
        {
          success: false,
          error: "فقط ارائه‌دهنده میتواند مرکز کرایه را ویرایش کند.",
        },
        { status: 403 },
      );

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id))
      return NextResponse.json(
        { success: false, error: "شناسه مرکز کرایه معتبر نیست." },
        { status: 400 },
      );

    await connectDB();
    const shop = await ShopModel.findOne({ _id: id, owner: user._id });
    if (!shop)
      return NextResponse.json(
        { success: false, error: "مرکز کرایه پیدا نشد یا متعلق به شما نیست." },
        { status: 404 },
      );

    const form = await request.formData();
    const parsed = shopUpdateSchema.safeParse({
      name: form.get("name"),
      description: form.get("description") ?? "",
      address: form.get("address"),
      phone: form.get("phone"),
    });
    if (!parsed.success)
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "معلومات معتبر نیست.",
        },
        { status: 400 },
      );

    const duplicate = await ShopModel.findOne({
      _id: { $ne: shop._id },
      phone: parsed.data.phone,
    });
    if (duplicate)
      return NextResponse.json(
        { success: false, error: "این شماره برای مرکز کرایه دیگری ثبت شده است." },
        { status: 409 },
      );
    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      const extensions: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      };
      if (!extensions[image.type])
        return NextResponse.json(
          { success: false, error: "فرمت عکس باید JPG، PNG یا WEBP باشد." },
          { status: 400 },
        );
      if (image.size === 0 || image.size > 2 * 1024 * 1024)
        return NextResponse.json(
          { success: false, error: "حجم عکس حداکثر ۲ مگابایت باشد." },
          { status: 400 },
        );
      const uploaded = await uploadImage(image, `shops/${id}/shop`);
      oldImageFileId = shop.imageFileId || "";
      shop.image = uploaded.url;
      shop.imageFileId = uploaded.fileId;
      newImageFileId = uploaded.fileId;
    }
    shop.name = parsed.data.name;
    shop.description = parsed.data.description;
    shop.address = parsed.data.address;
    shop.phone = parsed.data.phone;

    await shop.save();
    
    if (oldImageFileId) { try { await deleteImageFromImageKit(oldImageFileId); } catch (cleanupError) { console.error("OLD SHOP IMAGE CLEANUP:", cleanupError); } }
    return NextResponse.json({
      success: true,
      message: "معلومات مرکز کرایه ویرایش شد.",
    });
  } catch (error) {
    if (newImageFileId) { try { await deleteImageFromImageKit(newImageFileId); } catch {} }
    console.error("SHOP PATCH", error);
    return NextResponse.json(
      { success: false, error: "ویرایش مرکز کرایه انجام نشد." },
      { status: 500 },
    );
  }
}
