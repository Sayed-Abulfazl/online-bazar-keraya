import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";
import mongoose from "mongoose";

import UserModel from "@/models/UserModel";
import ItemModel from "@/models/ItemModel";
import { verifyToken } from "@/ib/auth";
import { connectDB } from "@/ib/mongodb";
import type { LeanItemRecord, PopulatedUserRecord } from "@/types";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  priceDaily: z.coerce.number().min(1).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};


export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, error: "شناسه جنس معتبر نیست." }, { status: 400 });
    await connectDB();
    const item = await ItemModel.findById(id).populate("shop", "name address phone image owner").populate("owner", "name").lean<(LeanItemRecord & { owner?: PopulatedUserRecord | null }) | null>();
    if (!item || !item.shop) return NextResponse.json({ success: false, error: "جنس پیدا نشد." }, { status: 404 });
    return NextResponse.json({ success: true, item: { id: String(item._id), name: item.name, description: item.description, image: item.image, priceDaily: item.priceDaily, shop: { id: String(item.shop._id), name: item.shop.name, address: item.shop.address, phone: item.shop.phone, image: item.shop.image }, ownerId: String(item.owner?._id || item.owner), ownerName: item.owner?.name || "" } });
  } catch (error) {
    console.error("GET ITEM:", error);
    return NextResponse.json({ success: false, error: "دریافت جنس انجام نشد." }, { status: 500 });
  }
}


async function getOwner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = await verifyToken(token);
    const userId = decoded?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) return null;

    const user = await UserModel.findById(userId);

    if (!user || user.role !== "owner") return null;

    return user;
  } catch {
    return null;
  }
}

// PUT: ویرایش جنس
export async function PUT(request: Request, context: RouteContext) {

  let oldImageFileId = "";
  let newImageFileId = "";

  try {
    await connectDB();

    const owner = await getOwner();

    if (!owner) {
      return NextResponse.json(
        { message: "ابتدا وارد حساب مالک شوید." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "شناسه جنس معتبر نیست." },
        { status: 400 }
      );
    }

    const item = await ItemModel.findOne({
      _id: id,
      owner: owner._id,
    });

    if (!item) {
      return NextResponse.json(
        { message: "جنس پیدا نشد یا متعلق به شما نیست." },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    const parsed = updateSchema.safeParse({
      ...(formData.has("name") ? { name: formData.get("name") } : {}),
      ...(formData.has("description")
        ? { description: formData.get("description") }
        : {}),
      ...(formData.has("priceDaily")
        ? { priceDaily: formData.get("priceDaily") }
        : {}),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "اطلاعات واردشده معتبر نیست.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    if (
      updates.name === undefined &&
      updates.description === undefined &&
      updates.priceDaily === undefined &&
      !formData.has("image")
    ) {
      return NextResponse.json(
        { message: "هیچ تغییری برای ذخیره وجود ندارد." },
        { status: 400 }
      );
    }

    if (updates.name !== undefined) item.name = updates.name;
    if (updates.description !== undefined) {
      item.description = updates.description;
    }
    if (updates.priceDaily !== undefined) {
      item.priceDaily = updates.priceDaily;
    }

    const image = formData.get("image");

    if (image !== null) {
      if (!(image instanceof File)) {
        return NextResponse.json(
          { message: "عکس معتبر نیست." },
          { status: 400 }
        );
      }

      if (!Object.hasOwn(allowedTypes, image.type)) {
        return NextResponse.json(
          { message: "فرمت عکس باید JPG، PNG یا WEBP باشد." },
          { status: 400 }
        );
      }

      if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { message: "حجم عکس باید بیشتر از صفر و حداکثر ۲ مگابایت باشد." },
          { status: 400 }
        );
      }

      const shopId = item.shop.toString();
      oldImageFileId = item.imageFileId || "";
      const uploaded = await uploadImage(image, `shops/${shopId}/items`);
      item.image = uploaded.url;
      item.imageFileId = uploaded.fileId;
      newImageFileId = uploaded.fileId;
    }

    await item.save();

    // عکس قبلی فقط پس از ذخیره موفق سند حذف میشود.
    if (oldImageFileId) { try { await deleteImageFromImageKit(oldImageFileId); } catch (cleanupError) { console.error("OLD ITEM IMAGE CLEANUP:", cleanupError); } }

    return NextResponse.json(
      { message: "جنس با موفقیت ویرایش شد.", item },
      { status: 200 }
    );
  } catch (error) {
    if (newImageFileId) { try { await deleteImageFromImageKit(newImageFileId); } catch {} }
    console.error("Update item error:", error);

    return NextResponse.json(
      { message: "هنگام ویرایش جنس خطایی رخ داد." },
      { status: 500 }
    );
  }
}

// DELETE: حذف جنس
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await connectDB();

    const owner = await getOwner();

    if (!owner) {
      return NextResponse.json(
        { message: "ابتدا وارد حساب مالک شوید." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "شناسه جنس معتبر نیست." },
        { status: 400 }
      );
    }

    const item = await ItemModel.findOne({
      _id: id,
      owner: owner._id,
    });

    if (!item) {
      return NextResponse.json(
        { message: "جنس پیدا نشد یا متعلق به شما نیست." },
        { status: 404 }
      );
    }

    await ItemModel.deleteOne({ _id: item._id });
    try { await deleteImageFromImageKit(item.imageFileId); } catch (cleanupError) { console.error("ITEM IMAGE CLEANUP:", cleanupError); }

    return NextResponse.json(
      { message: "جنس با موفقیت حذف شد." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete item error:", error);

    return NextResponse.json(
      { message: "هنگام حذف جنس خطایی رخ داد." },
      { status: 500 }
    );
  }
}
