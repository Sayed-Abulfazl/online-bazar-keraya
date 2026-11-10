import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { verifyToken } from "@/ib/auth";
import { connectDB } from "@/ib/mongodb";
import myUserModel from "@/models/UserModel";

export async function GET() {
    try {
        const cookieStore = await cookies();

        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({
                user: null,
            });
        }
        const payload = verifyToken(token);

        if (!payload) {
            return NextResponse.json({
                user: null,
            });
        }

        await connectDB();

        const user = await myUserModel.findById(payload.userId).select("-password");
        
        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profileImage: user.profileImage,
                address: user.address,
            },
        });
    } catch (error) {
        console.error("AUTH ME ERROR:", error);

        return NextResponse.json({
            user: null,
        });
    }
}
