import { cookies } from "next/headers";
import { verifyToken } from "@/ib/auth";
import { connectDB } from "@/ib/mongodb";
import UserModel from "@/models/UserModel";
import mongoose from "mongoose";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId || !mongoose.isValidObjectId(payload.userId))
    return null;
  await connectDB();
  const user = await UserModel.findById(payload.userId).select("-password");
  if (!user || user.role === "admin") return null;
  return user;
}

// Admin sessions use their own cookie and their own collection, never UserModel.
export { getAdminUser, getAdminSession, getMasterAdmin } from "@/ib/admin-auth";
