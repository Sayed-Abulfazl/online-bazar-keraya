import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/ib/mongodb";
import ContactMessage from "@/models/ContactMessageModel";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(3000),
});
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "اطلاعات معتبر نیست.",
        },
        { status: 400 },
      );
    await connectDB();
    await ContactMessage.create(parsed.data);
    return NextResponse.json(
      { success: true, message: "پیام شما ثبت شد. تشکر از تماس شما." },
      { status: 201 },
    );
  } catch (error) {
    console.error("CONTACT MESSAGE:", error);
    return NextResponse.json(
      { success: false, error: "ارسال پیام انجام نشد. دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
