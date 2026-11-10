import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "از حساب خارج شدید.",
  });

  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
