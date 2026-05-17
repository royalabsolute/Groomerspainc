import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public", "favicon.svg");
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=86400, must-revalidate",
            },
        });
    } catch (error) {
        return new NextResponse("Icon not found", { status: 404 });
    }
}
