import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "@/ib/mongodb";
import AdminModel from "@/models/AdminModel";

const COOKIE_NAME = "admin_token";

type AdminRole = "master" | "admin";
export type AdminSession = {
  id: string;
  name: string;
  role: AdminRole;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured");
  return value;
}

export function createAdminToken(admin: AdminSession) {
  return jwt.sign(
    {
      adminId: admin.id,
      role: admin.role,
      name: admin.name,
    },
    secret(),
    { expiresIn: "7d" },
  );
}

function readAdminToken(token: string): AdminSession | null {
  try {
    const value = jwt.verify(token, secret());
    if (typeof value === "string") return null;
    const payload = value as JwtPayload & {
      adminId?: unknown;
      role?: unknown;
      name?: unknown;
    };
    if (
      typeof payload.adminId !== "string" ||
      (payload.role !== "master" && payload.role !== "admin") ||
      typeof payload.name !== "string"
    )
      return null;
    return {
      id: payload.adminId,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = readAdminToken(token);
  if (!session) return null;
  if (session.role === "master") {
    const configuredName = process.env.ADMIN_NAME?.trim().toLowerCase();
    if (!configuredName || session.name.trim().toLowerCase() !== configuredName)
      return null;
    return session;
  }
  await connectDB();
  const admin = (await AdminModel.findById(session.id)
    .select("name active")
    .lean()) as { name?: string; active?: boolean } | null;
  if (!admin || !admin.active || admin.name !== session.name) return null;
  return session;
}

export async function getAdminUser() {
  return getAdminSession();
}

export async function getMasterAdmin() {
  const admin = await getAdminSession();
  return admin?.role === "master" ? admin : null;
}
