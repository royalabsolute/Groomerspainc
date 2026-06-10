/**
 * email.ts — Nodemailer SMTP Transport
 *
 * KEY DESIGN DECISIONS:
 * 1. Lazy transporter initialization — avoids crash when env vars aren't loaded yet
 * 2. SMTP verification on first use (not at module load time)
 * 3. Detailed structured logging for every send attempt
 * 4. All outbound emails are English-only — locale is NEVER used here
 */

import nodemailer from "nodemailer";

// ─── Lazy singleton ───────────────────────────────────────────────────────────
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (_transporter) return _transporter;

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.error(
            "❌ [SMTP] SMTP_USER and/or SMTP_PASS are not set in environment variables.\n" +
            "   → Email sending will fail. Add them to .env.production on the VPS:\n" +
            "   SMTP_USER=groomersincpetspa@gmail.com\n" +
            "   SMTP_PASS=<16-char Google App Password>"
        );
    }

    _transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,       // TLS on 465, STARTTLS on 587
        auth: {
            user: user || "",
            pass: pass || "",
        },
        // Increase timeout for slow VPS networks
        connectionTimeout: 10_000,  // 10s to establish connection
        greetingTimeout: 10_000,    // 10s for server EHLO
        socketTimeout: 30_000,      // 30s for individual socket ops
    });

    return _transporter;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// ─── Core send function ───────────────────────────────────────────────────────
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, replyTo } = opts;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!to || !subject || !html) {
        const msg = `[SMTP] Missing required fields — to: "${to}", subject: "${subject}"`;
        console.error("❌", msg);
        return { success: false, error: msg };
    }

    const smtpUser = process.env.SMTP_USER;
    if (!smtpUser) {
        const msg = "[SMTP] SMTP_USER env var not set — cannot send email";
        console.error("❌", msg);
        return { success: false, error: msg };
    }

    // ── Wrap bare HTML in a consistent container ─────────────────────────────
    const htmlFull = html.includes("<!DOCTYPE") || html.includes("<html")
        ? html
        : `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
           <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
             ${html}
             <hr style="margin-top:30px;border:none;border-top:1px solid #EEE;">
             <p style="font-size:11px;color:#999;text-align:center;">
               This is an automated message from <strong>Groomers, INC.</strong>
               Please do not reply directly to this email.
             </p>
           </body></html>`;

    const fromName = "Groomers, INC.";
    const fromAddr = smtpUser;

    const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromAddr}>`,
        to,
        subject,
        html: htmlFull,
        ...(replyTo ? { replyTo } : {}),
        // Prevent Gmail from threading unrelated emails
        headers: {
            "X-Mailer": "Groomers-INC-App/1.0",
        },
    };

    try {
        console.log(`📧 [SMTP] Attempting send → to: "${to}" | subject: "${subject}"`);

        const transporter = getTransporter();
        const info = await transporter.sendMail(mailOptions);

        console.log(
            `✅ [SMTP] Sent successfully\n` +
            `   → To: ${to}\n` +
            `   → Message-ID: ${info.messageId}\n` +
            `   → Response: ${info.response || "n/a"}`
        );

        return { success: true, messageId: info.messageId };

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errCode = (err as any)?.code || "UNKNOWN";
        const errCommand = (err as any)?.command || "";

        // ── Actionable diagnostics ───────────────────────────────────────────
        let hint = "";
        if (errCode === "EAUTH") {
            hint = "Gmail authentication failed. Ensure SMTP_PASS is a valid 16-char App Password (not your Gmail login password). Enable 2FA and generate one at: Google Account → Security → App Passwords.";
        } else if (errCode === "ECONNECTION" || errCode === "ECONNREFUSED") {
            hint = "Cannot connect to Gmail SMTP. Check VPS firewall — port 465 (or 587) must be open outbound.";
        } else if (errCode === "ETIMEDOUT") {
            hint = "SMTP connection timed out. VPS may be blocking outbound port 465. Try SMTP_PORT=587 as an alternative.";
        } else if (errMsg.includes("Invalid login")) {
            hint = "Gmail rejected the credentials. Verify SMTP_USER and SMTP_PASS in .env.production on the VPS.";
        }

        console.error(
            `❌ [SMTP ERROR] Failed to send email\n` +
            `   → To: ${to}\n` +
            `   → Code: ${errCode} | Command: ${errCommand}\n` +
            `   → Error: ${errMsg}\n` +
            (hint ? `   → FIX: ${hint}` : "")
        );

        // Reset transporter so next attempt gets a fresh connection
        _transporter = null;

        return { success: false, error: `${errCode}: ${errMsg}` };
    }
}

// ─── SMTP health check (call from admin diagnostic endpoint) ──────────────────
export async function verifySMTPConnection(): Promise<{ ok: boolean; message: string }> {
    try {
        const transporter = getTransporter();
        await transporter.verify();
        console.log("✅ [SMTP] Connection verified successfully");
        return { ok: true, message: "SMTP connection healthy" };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("❌ [SMTP] Verification failed:", msg);
        return { ok: false, message: msg };
    }
}
