import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/smtp-check
 * Verifies SMTP connection health. Admin-only.
 * Use this to debug email delivery issues.
 *
 * Response: { ok: boolean, message: string, config: { host, port, user, hasPass } }
 */
export async function GET(request: NextRequest) {
    // Auth guard — admins only (NextAuth v5)
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verifySMTPConnection } = await import("@/lib/email");

    const config = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || "465",
        user: process.env.SMTP_USER || "NOT SET",
        hasPass: !!(process.env.SMTP_PASS),
        passLength: process.env.SMTP_PASS?.length || 0,
    };

    const result = await verifySMTPConnection();

    return NextResponse.json({
        ok: result.ok,
        message: result.message,
        config,
        timestamp: new Date().toISOString(),
        hint: result.ok
            ? "SMTP is configured correctly. Emails should be delivered."
            : config.user === "NOT SET"
                ? "SMTP_USER is not set in environment variables. Add it to .env.production on the VPS."
                : !config.hasPass
                    ? "SMTP_PASS is not set. Generate a 16-character Google App Password at: Google Account → Security → App Passwords."
                    : "SMTP connection failed. Check VPS firewall — port 465 must be open outbound, or try SMTP_PORT=587.",
    });
}
