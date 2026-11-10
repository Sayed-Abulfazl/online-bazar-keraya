import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { uploadImage, deleteImageFromImageKit } from "@/ib/imagekit";
import { getCurrentUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import UserModel from "@/models/UserModel";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import OrderModel from "@/models/OrderModel";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants";
import type { LeanOrderRecord } from "@/types";

export const runtime = "nodejs";

function publicUser(user: { _id: unknown; name: string; email: string; phone: string; role: string; profileImage?: string; address?: string; createdAt: Date }) {
  return { id: String(user._id), name: user.name, email: user.email, phone: user.phone,
    role: user.role, profileImage: user.profileImage || "", address: user.address || "", createdAt: user.createdAt };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "ابتدا وارد حساب شوید." }, { status: 401 });
  await connectDB();
  let earnings = 0;
  let averageRating = 0;
  let ratingCount = 0;
  if (user.role === "owner") {
    const completed = await OrderModel.find({ owner: user._id, status: "paid" }).select("items rating").lean<LeanOrderRecord[]>();
    earnings = completed.reduce((sum, order) => sum + (order.items || []).reduce((lineSum: number, item: LeanOrderRecord["items"][number]) => lineSum + Number(item.priceDaily || 0) * Number(item.quantity || 1) * Number(item.days || 1), 0), 0);
    const rated = completed.filter((order) => Number(order.rating) >= 1 && Number(order.rating) <= 5);
    ratingCount = rated.length;
    averageRating = ratingCount ? rated.reduce((sum, order) => sum + Number(order.rating), 0) / ratingCount : 0;
  }
  return NextResponse.json({ success: true, user: { ...publicUser(user), earnings, averageRating, ratingCount } });
}

export async function PATCH(request: Request) {

  let oldImageFileId = "";
  let newImageFileId = "";
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ success: false, error: "ابتدا وارد حساب شوید." }, { status: 401 });
    await connectDB();
    const form = await request.formData();
    const schema = z.object({
      name: z.string().trim().min(3).max(100),
      email: z.string().trim().toLowerCase().email(),
      phone: z.string().trim().min(1).max(30).refine(v => v.replace(/\D/g, "").length >= 10, "شماره تماس باید حداقل ۱۰ رقم داشته باشد."),
      address: z.string().trim().min(3, "آدرس الزامی است.").max(300),
      password: z.string().optional().default(""),
    });
    const parsed = schema.safeParse({
      name: form.get("name"), email: form.get("email"), phone: form.get("phone"),
      address: form.get("address") ?? "", password: form.get("password") ?? "",
    });
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "معلومات معتبر نیست." }, { status: 400 });
    if (parsed.data.password && parsed.data.password.length < 8)
      return NextResponse.json({ success: false, error: "رمز عبور حداقل ۸ حرف باشد." }, { status: 400 });
    const duplicate = await UserModel.findOne({ _id: { $ne: current._id }, $or: [{ email: parsed.data.email }, { phone: parsed.data.phone }] });
    if (duplicate) return NextResponse.json({ success: false, error: duplicate.email === parsed.data.email ? "این ایمیل قبلاً استفاده شده است." : "این شماره قبلاً استفاده شده است." }, { status: 409 });

    const image = form.get("profileImage");
    if (image instanceof File && image.size > 0) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(image.type)) return NextResponse.json({ success: false, error: "فرمت عکس باید JPG، PNG یا WEBP باشد." }, { status: 400 });
      if (image.size === 0 || image.size > MAX_IMAGE_SIZE) return NextResponse.json({ success: false, error: "حجم عکس حداکثر ۲ مگابایت باشد." }, { status: 400 });
      oldImageFileId = current.profileImageFileId || "";
      const uploaded = await uploadImage(image, "profiles");
      current.profileImage = uploaded.url;
      current.profileImageFileId = uploaded.fileId;
      newImageFileId = uploaded.fileId;
    }
    current.name = parsed.data.name;
    current.email = parsed.data.email;
    current.phone = parsed.data.phone;
    current.address = parsed.data.address;
    if (parsed.data.password) current.password = await bcrypt.hash(parsed.data.password, 12);
    await current.save();
    if (oldImageFileId) { try { await deleteImageFromImageKit(oldImageFileId); } catch (cleanupError) { console.error("OLD PROFILE IMAGE CLEANUP:", cleanupError); } }
    return NextResponse.json({ success: true, message: "پروفایل با موفقیت ویرایش شد.", user: publicUser(current) });
  } catch (error: unknown) {
    if (newImageFileId) { try { await deleteImageFromImageKit(newImageFileId); } catch {} }
    console.error("PROFILE PATCH:", error);
    return NextResponse.json({ success: false, error: "ذخیره تغییرات انجام نشد." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "ابتدا وارد حساب شوید." }, { status: 401 });
    if (user.role === "admin") return NextResponse.json({ success: false, error: "حساب مدیر را از این بخش حذف نکنید." }, { status: 403 });
    let body: { password?: unknown } = {};
    try { body = (await request.json()) as { password?: unknown }; } catch {}
    if (typeof body.password !== "string" || !body.password) return NextResponse.json({ success: false, error: "برای حذف حساب، رمز عبور خود را وارد کنید." }, { status: 400 });
    await connectDB();
    const securedUser = await UserModel.findById(user._id).select("+password");
    if (!securedUser || !(await bcrypt.compare(body.password, securedUser.password))) return NextResponse.json({ success: false, error: "رمز عبور واردشده درست نیست." }, { status: 401 });
    const shops = await ShopModel.find({ owner: user._id }).select("_id");
    const shopIds = shops.map((shop) => shop._id);
    const ownedShops = await ShopModel.find({ owner: user._id }).select("_id imageFileId");
    const ownedItems = await ItemModel.find({ $or: [{ owner: user._id }, { shop: { $in: shopIds } }] }).select("imageFileId");
    await Promise.all([...ownedShops.map((shop) => deleteImageFromImageKit(shop.imageFileId)), ...ownedItems.map((item) => deleteImageFromImageKit(item.imageFileId))]);
    await OrderModel.deleteMany({ $or: [{ customer: user._id }, { owner: user._id }, { shop: { $in: shopIds } }] });
    await ItemModel.deleteMany({ $or: [{ owner: user._id }, { shop: { $in: shopIds } }] });
    await ShopModel.deleteMany({ owner: user._id });
    await deleteImageFromImageKit(user.profileImageFileId);
    await UserModel.findByIdAndDelete(user._id);
    const response = NextResponse.json({ success: true, message: "حساب و اطلاعات وابسته حذف شد." });
    response.cookies.set("auth_token", "", { httpOnly: true, expires: new Date(0), path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return response;
  } catch (error) {
    console.error("PROFILE DELETE:", error);
    return NextResponse.json({ success: false, error: "حذف حساب انجام نشد." }, { status: 500 });
  }
}
