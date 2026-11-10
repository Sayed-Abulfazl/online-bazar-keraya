import { NextResponse } from "next/server";
import { getAdminSession } from "@/ib/admin-auth";

export async function GET() {
  const admin = await getAdminSession();
  return NextResponse.json({
    admin: admin
      ? {
          id: admin.id,
          name: admin.name,
          role: admin.role,
        }
      : null,
  });
}
