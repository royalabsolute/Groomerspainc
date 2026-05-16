import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "royalabsolute0@gmail.com",
        pass: "ofth sztq efyj cvzu",
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
            from: '"GroomingPet" <royalabsolute0@gmail.com>',
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
