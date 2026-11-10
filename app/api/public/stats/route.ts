import { NextResponse } from "next/server";
import { connectDB } from "@/ib/mongodb";
import UserModel from "@/models/UserModel";
import ItemModel from "@/models/ItemModel";

export async function GET() {
  try {
    await connectDB();
    const [customers, owners, items] = await Promise.all([
      UserModel.countDocuments({ role: "user" }),
      UserModel.countDocuments({ role: "owner" }),
      ItemModel.countDocuments(),
    ]);
    return NextResponse.json({ success: true, customers, owners, items });
  } catch {
    return NextResponse.json({
      success: false,
      customers: 0,
      owners: 0,
      items: 0,
    });
  }
}
