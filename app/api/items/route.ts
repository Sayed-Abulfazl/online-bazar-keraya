import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";
import crypto from "crypto";

import UserModel from "@/models/UserModel";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import { verifyToken } from "@/ib/auth";
import { connectDB } from "@/ib/mongodb";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const itemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  priceDaily: z.coerce.number().min(1),
  shopId: z.string().min(1),
});

async function getOwner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = await verifyToken(token);
    const userId = decoded?.userId;

    if (!userId) return null;

    const user = await UserModel.findById(userId);

    if (!user || user.role !== "owner") return null;

    return user;
  } catch {
    return null;
  }
}

// POST: ثبت جنس جدید
export async function POST(request: Request) {
  let uploadedImageFileId = "";
  let createdItemId = "";

  try {
    await connectDB();

    const owner = await getOwner();

    if (!owner) {
      return NextResponse.json(
        { message: "ابتدا وارد حساب مالک شوید." },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const parsed = itemSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") ?? "",
      priceDaily: formData.get("priceDaily"),
      shopId: formData.get("shopId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "اطلاعات واردشده معتبر نیست.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, description, priceDaily, shopId } = parsed.data;

    if (!crypto.randomUUID) {
      return NextResponse.json(
        { message: "سیستم ساخت شناسه در دسترس نیست." },
        { status: 500 },
      );
    }

    if (!/^[a-f\d]{24}$/i.test(shopId)) {
      return NextResponse.json(
        { message: "شناسه فروشگاه معتبر نیست." },
        { status: 400 },
      );
    }

    const shop = await ShopModel.findOne({
      _id: shopId,
      owner: owner._id,
    });

    if (!shop) {
      return NextResponse.json(
        { message: "فروشگاه پیدا نشد یا متعلق به شما نیست." },
        { status: 403 },
      );
    }

    if (!shop.active) return NextResponse.json({ message: "فروشگاه هنوز توسط مدیر کل تأیید نشده است." }, { status: 403 });

    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { message: "لطفاً عکس جنس را انتخاب کنید." },
        { status: 400 },
      );
    }

    if (!Object.hasOwn(allowedTypes, image.type)) {
      return NextResponse.json(
        { message: "فرمت عکس باید JPG، PNG یا WEBP باشد." },
        { status: 400 },
      );
    }

    if (image.size === 0 || image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { message: "حجم عکس باید بیشتر از صفر و حداکثر ۲ مگابایت باشد." },
        { status: 400 },
      );
    }

    const uploadedImage = await uploadImage(image, `shops/${shopId}/items`);
    const imageUrl = uploadedImage.url;
    uploadedImageFileId = uploadedImage.fileId;

    const item = await ItemModel.create({
      shop: shop._id,
      owner: owner._id,
      name,
      description,
      priceDaily,
      image: imageUrl,
      imageFileId: uploadedImage.fileId,
    });

    createdItemId = item._id.toString();

    return NextResponse.json(
      {
        message: "جنس با موفقیت ثبت شد.",
        item,
      },
      { status: 201 },
    );
  } catch (error) {
    if (createdItemId) {
      try {
        await ItemModel.findByIdAndDelete(createdItemId);
      } catch {}
    }

    if (uploadedImageFileId) {
      try { await deleteImageFromImageKit(uploadedImageFileId); } catch {}
    }

    console.error("Create item error:", error);

    return NextResponse.json(
      { message: "هنگام ثبت جنس خطایی رخ داد." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    const filter: Record<string, unknown> = {};

    if (shopId) {
      if (!/^[a-f\d]{24}$/i.test(shopId)) {
        return NextResponse.json(
          { message: "شناسه فروشگاه معتبر نیست." },
          { status: 400 }
        );
      }

      filter.shop = shopId;
    }

    const items = await ItemModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("shop", "name address")
      .populate("owner", "name")
      .lean();

    return NextResponse.json({
      success: true,
      items: items.map((item) => {
        const shop = item.shop as {
          _id?: { toString(): string };
          name?: string;
          address?: string;
        } | null;

        const owner = item.owner as {
          _id?: { toString(): string };
          name?: string;
        } | null;

        return {
          id: String(item._id),
          name: item.name,
          description: item.description,
          priceDaily: item.priceDaily,
          image: item.image,
          shopId: String(shop?._id || ""),
          shopName: shop?.name || "",
          shopAddress: shop?.address || "",
          ownerId: String(owner?._id || ""),
          ownerName: owner?.name || "",
          createdAt: item.createdAt,
        };
      }),
    });

  } catch (error) {
    console.error("GET ITEMS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "دریافت اجناس انجام نشد." },
      { status: 500 }
    );
  }
}
