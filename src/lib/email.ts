import nodemailer from "nodemailer";

// Configuración estricta de variables de entorno (Sin credenciales hardcodeadas)
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// Validación temprana para entorno de producción
if (process.env.NODE_ENV === "production" && (!smtpUser || !smtpPass)) {
    console.warn("⚠️ [SRE WARNING] SMTP credentials are not set in production environment!");
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
        user: smtpUser || "",
        pass: smtpPass || "",
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        // Validación de parámetros
        if (!to || !subject || !html) {
            throw new Error("Missing required email fields (to, subject, html).");
        }

        // Wrapper de estilos en línea (Inline CSS) para garantizar compatibilidad con clientes de correo
        const htmlWithStyles = html.includes("<!DOCTYPE html>") || html.includes("<html")
            ? html
            : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #333; border: 1px solid #ddd; border-radius: 8px;">
                ${html}
                <div style="margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                    Este es un mensaje automático de <strong>Groomers, INC</strong>. Por favor, no respondas directamente a este correo.
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Groomers, INC." <${smtpUser}>`,
            to,
            subject,
            html: htmlWithStyles,
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ [SMTP] Email sent successfully to: ${to} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ [SMTP ERROR] Failed to send email:", error);
        // Devuelve false sin romper el hilo principal del backend
        return { success: false, error: error instanceof Error ? error.message : "Unknown SMTP Error" };
    }
}
