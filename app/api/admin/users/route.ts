import { NextResponse } from "next/server";
import { getAdminUser } from "@/ib/server-auth";
import { connectDB } from "@/ib/mongodb";
import UserModel from "@/models/UserModel";
import ShopModel from "@/models/ShopModel";
import ItemModel from "@/models/ItemModel";
import type { LeanUserRecord } from "@/types";

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin)
      return NextResponse.json(
        { success: false, error: "دسترسی فقط برای مدیر مجاز است." },
        { status: 403 },
      );
    await connectDB();
    const users = await UserModel.find({ role: { $in: ["user", "owner"] } })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean<LeanUserRecord[]>();
    const [customers, owners, shops, items] = await Promise.all([
      UserModel.countDocuments({ role: "user" }),
      UserModel.countDocuments({ role: "owner" }),
      ShopModel.countDocuments(),
      ItemModel.countDocuments(),
    ]);
    return NextResponse.json({
      success: true,
      stats: { customers, owners, shops, items },
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        profileImage: u.profileImage || "",
        address: u.address || "",
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("ADMIN USERS:", error);
    return NextResponse.json(
      { success: false, error: "گرفتن فهرست کاربران انجام نشد." },
      { status: 500 },
    );
  }
}
