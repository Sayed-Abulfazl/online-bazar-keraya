import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";
import mongoose from "mongoose";

import { verifyToken } from "@/ib/auth";
import { connectDB } from "@/ib/mongodb";
import MyShopModel from "@/models/ShopModel";
import myUserModel from "@/models/UserModel";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants";

export const runtime = "nodejs";

// ========================================
// Validation
// ========================================

const shopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام فروشگاه حداقل ۲ کاراکتر باشد.")
    .max(100, "نام فروشگاه بیش از حد طولانی است."),

  description: z
    .string()
    .trim()
    .max(1000, "توضیحات بیش از حد طولانی است.")
    .default(""),

  address: z
    .string()
    .trim()
    .min(2, "آدرس فروشگاه را وارد کنید.")
    .max(300, "آدرس بیش از حد طولانی است."),

  phone: z
    .string()
    .trim()
    .min(1, "شماره تماس الزامی است.")
    .max(30, "شماره تماس بیش از حد طولانی است.")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 10,
      "شماره تماس باید حداقل ۱۰ رقم داشته باشد.",
    ),
});

// ========================================
// Helpers
// ========================================

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}


async function authenticateOwner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return {
      user: null,
      response: jsonError("ابتدا وارد حساب خود شوید.", 401),
    };
  }

  const payload = verifyToken(token);

  if (!payload?.userId) {
    return {
      user: null,
      response: jsonError("نشست شما معتبر نیست.", 401),
    };
  }

  await connectDB();

  const user = await myUserModel.findById(payload.userId);

  if (!user) {
    return {
      user: null,
      response: jsonError("کاربر پیدا نشد.", 404),
    };
  }

  if (user.role !== "owner") {
    return {
      user: null,
      response: jsonError("فقط ارائه دهندگان میتوانند مرکز کرایه ثبت کنند.", 403),
    };
  }

  return { user, response: null };
}

// ========================================
// POST /api/shops
// Create a shop
// ========================================

export async function POST(request: Request) {
  let createdShopId: string | null = null;
  let uploadedImageFileId = "";

  try {
    // 1. Authenticate
    const auth = await authenticateOwner();

    if (auth.response) {
      return auth.response;
    }
    if(!auth.user){
      return jsonError("احراز هویت انجام نشد.", 401)
    }

    const user = auth.user;

    // 2. Read form data
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return jsonError("اطلاعات ارسالی معتبر نیست.", 400);
    }

    // 3. Validate text fields
    const validation = shopSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") ?? "",
      address: formData.get("address"),
      phone: formData.get("phone"),
    });

    if (!validation.success) {
      return jsonError(
        validation.error.issues[0]?.message || "اطلاعات مرکز کرایه معتبر نیست.",
        400,
      );
    }

    const data = validation.data;

    // 4. Validate image
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return jsonError("عکس مرکز کرایی الزامی است.", 400);
    }

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(image.type)) {
      return jsonError("فرمت عکس باید JPG، PNG یا WEBP باشد.", 400);
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return jsonError("حجم عکس نباید بیشتر از ۲ مگابایت باشد.", 400);
    }

    // 5. Check existing shop
    const existingShop = await MyShopModel.findOne({
      owner: user._id,
    }).select("_id");

    if (existingShop) {
      return jsonError("شما قبلاً یک مرکز کرایه ثبت کرده اید.", 409);
    }

    // 6. Generate shop ID and image URL before creating the document
    const shopId = new mongoose.Types.ObjectId().toString();

    createdShopId = shopId;

    const uploadedImage = await uploadImage(image, `shops/${shopId}/shop`);
    const imageUrl = uploadedImage.url;
    uploadedImageFileId = uploadedImage.fileId;

    // 9. Create shop with a real image URL
    // This avoids the Mongoose "image is required" error.
    const shop = await MyShopModel.create({
      _id: shopId,
      owner: user._id,
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      image: imageUrl,
      imageFileId: uploadedImage.fileId,
      active: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "مرکز کرایه با موفقیت ثبت و در انتظار تایید است.",
        shop: {
          id: String(shop._id),
          active: shop.active === true,
          name: shop.name,
          description: shop.description,
          image: shop.image,
          address: shop.address,
          phone: shop.phone,
          ownerName: user.name,
          createdAt: shop.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);

    // Remove incomplete files and database record if necessary.
    if (createdShopId) {
      try {
        await MyShopModel.findByIdAndDelete(createdShopId);
      } catch (cleanupError) {
        console.error("SHOP DATABASE CLEANUP ERROR:", cleanupError);
      }
    }

    if (uploadedImageFileId) { try { await deleteImageFromImageKit(uploadedImageFileId); } catch {} }

    if (isDuplicateKeyError(error)) {
      return jsonError(
        "این شماره تماس قبلاً برای مرکز کرایه دیگری ثبت شده است.",
        409,
      );
    }

    return jsonError(
      "ثبت مرکز کرایه انجام نشد. اطلاعات و عکس را بررسی کرده و دوباره تلاش کنید.",
      500,
    );
  }
}

// ========================================
// GET /api/shops
// Get shops
// ========================================

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const payload = token ? verifyToken(token) : null;
    const ownId =
      payload?.userId && mongoose.isValidObjectId(payload.userId)
        ? payload.userId
        : null;
    const shopFilter = ownId
      ? { $or: [{ active: true }, { owner: ownId }] }
      : { active: true };
    const shops = await MyShopModel.find(shopFilter)
      .sort({ createdAt: -1 })
      .populate("owner", "name")
      .lean();

      console.log(shops.length)

    return NextResponse.json({
      success: true,
      shops: shops.map((shop) => {
        const owner = shop.owner as {
          name?: string;
        } | null;

        return {
          id: String(shop._id),
          active: shop.active === true,
          name: shop.name,
          description: shop.description,
          image: shop.image,
          address: shop.address,
          phone: shop.phone,
          ownerName: owner?.name || "",
          ownerId: String(shop.owner?._id || shop.owner || ""),
          createdAt: shop.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET SHOPS ERROR:", error);

    return jsonError("دریافت مراکر کرایی انجام نشد.", 500);
  }
}