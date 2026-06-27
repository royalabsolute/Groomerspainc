import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { detectAndSavePublicIp } from "@/lib/minecraft";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const ip = await detectAndSavePublicIp();
    return NextResponse.json({ success: true, ip });
  } catch (err: any) {
    console.error("IP Route GET error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
