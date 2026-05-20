"use server";

import db from "@/lib/db";
import { hash } from "bcryptjs";

export async function forgotPassword(email: string) {
    try {
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Safety first: don't reveal if user exists or not
            return { success: true, message: "Si el correo está registrado, recibirás un link de recuperación." };
        }

        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

        await db.passwordResetToken.deleteMany({
            where: { email }
        });

        await db.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        const resetLink = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/es/login-admin/reset-password?token=${token}`;
        
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
            to: email,
            subject: "🐾 GroomingPet - Recuperación de Contraseña",
            html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#121212;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#E0E0E0;">

<table width="100%" cellpadding="0" cellspacing="0"
  style="background-color:#121212;padding:48px 20px;">
<tr><td align="center">

<table width="560" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#1A1A1A;border:4px solid #000000;border-radius:24px;overflow:hidden;box-shadow:8px 8px 0px 0px #7C3AED;">

  <tr>
    <td style="background:#7C3AED;border-bottom:4px solid #000000;padding:32px 30px 28px;text-align:center;">
      <div style="display:inline-block;background:#121212;color:#ffffff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;padding:5px 16px;border:2px solid #000000;border-radius:100px;box-shadow:3px 3px 0 #000000;margin-bottom:20px;">
        🔐 &nbsp;SEGURIDAD &nbsp;·&nbsp; Recuperar Acceso
      </div>
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-1px;line-height:1.1;">
        ¿OLVIDASTE TU CLAVE?
      </h1>
    </td>
  </tr>

  <tr>
    <td style="padding:40px 30px 10px;text-align:center;">
       <p style="margin:0;font-size:17px;color:#ffffff;line-height:1.6;font-weight:700;">
         Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de administrador.
       </p>
    </td>
  </tr>

  <tr>
    <td style="padding:10px 30px 40px;text-align:center;">
      <div style="margin-bottom:30px;background:#242424;border:3px solid #000000;border-radius:18px;padding:24px;box-shadow:6px 6px 0 #000000;">
        <p style="margin:0 0 20px;font-size:14px;color:#A78BFA;font-weight:600;">
          Haz clic en el botón de abajo para asignar una nueva contraseña segura.
        </p>
        <a href="${resetLink}"
          style="display:inline-block;background:#7C3AED;color:#ffffff;font-size:18px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:2px;padding:18px 40px;border:3px solid #000000;border-radius:16px;box-shadow:5px 5px 0 #000000;">
          CREAR NUEVA CLAVE →
        </a>
      </div>
      
      <p style="margin:0;font-size:11px;font-weight:700;color:#666666;letter-spacing:1px;text-transform:uppercase;">
        EL ENLACE SE AUTODESTRUIRÁ EN 1 HORA
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:#121212;padding:20px 28px;text-align:center;border-top:4px solid #000000;color:#666666;">
      <p style="margin:0;font-size:12px;font-weight:900;color:#7C3AED;text-transform:uppercase;letter-spacing:4px;">
        GroomingPet · Security Center
      </p>
      <p style="margin:4px 0 0;font-size:9px;font-weight:700;color:#444444;letter-spacing:1px;">
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
      </p>
    </td>
  </tr>

 </table>
</td></tr>
</table>

</body>
</html>`
        });

        return { success: true, message: "Las instrucciones de recuperación han sido enviadas a tu correo." };
    } catch (error) {
        console.error("Forgot password error:", error);
        return { success: false, error: "Error al procesar la solicitud" };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const resetToken = await db.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expires < new Date()) {
            return { success: false, error: "El token es inválido o ha expirado" };
        }

        const hashedPassword = await hash(newPassword, 12);

        await db.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword }
        });

        await db.passwordResetToken.delete({
            where: { id: resetToken.id }
        });

        return { success: true };
    } catch (error) {
        console.error("Reset password error:", error);
        return { success: false, error: "Error al cambiar la contraseña" };
    }
}
