import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER || "groomersincpetspa@gmail.com";
const smtpPass = (process.env.SMTP_PASS || "njtjtbpjyvpussdk").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: smtpUser,
        pass: smtpPass,
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
        const mailOptions = {
            from: `"GroomingPet" <${smtpUser}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);

        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
