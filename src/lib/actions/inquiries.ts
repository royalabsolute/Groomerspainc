"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export async function submitInquiry(data: any) {
    try {
        let petImageUrl = null;

        // Check if data is FormData (for file uploads)
        if (data instanceof FormData) {
            const name = data.get("name") as string;
            const email = data.get("email") as string;
            const phone = data.get("phone") as string;
            const service = data.get("service") as string;
            const message = data.get("message") as string;
            const address = data.get("address") as string;
            const appointmentDate = data.get("appointmentDate") ? new Date(data.get("appointmentDate") as string) : null;
            const appointmentTime = data.get("appointmentTime") as string;
            const discountCode = (data.get("discountCode") as string)?.trim().toUpperCase() || "";
            const petImage = data.get("petImage") as File;
            
            if (petImage && petImage.size > 0) {
                const bytes = await petImage.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const fileName = `${Date.now()}_${petImage.name.replace(/\s+/g, '_')}`;
                const uploadDir = path.join(process.cwd(), "public", "uploads", "inquiries");
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const filePath = path.join(uploadDir, fileName);
                await writeFile(filePath, buffer);
                petImageUrl = `/api/uploads/inquiries/${fileName}`;
            }

            // Create Inquiry
            try {
                await db.inquiry.create({
                    data: {
                        name,
                        email,
                        phone: phone || null,
                        service: service || null,
                        message,
                        address: address || null,
                        appointmentDate: appointmentDate,
                        appointmentTime: appointmentTime || null,
                        discountCode: discountCode || null,
                        petImageUrl
                    } as any
                });
            } catch (err: any) {
                if (err.message?.includes("Unknown argument")) {
                    const id = crypto.randomUUID();
                    await (db as any).$executeRaw`
                        INSERT INTO Inquiry (id, name, email, phone, service, message, address, appointmentDate, appointmentTime, discountCode, petImageUrl, status, read, createdAt, updatedAt)
                        VALUES (${id}, ${name}, ${email}, ${phone || null}, ${service || null}, ${message}, ${address || null}, ${appointmentDate ? appointmentDate.toISOString() : null}, ${appointmentTime || null}, ${discountCode || null}, ${petImageUrl}, 'PENDING', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `;
                } else {
                    throw err;
                }
            }

            // Increment discount code usage if exists
            if (discountCode) {
                const discountModel = (db as any).discountCode;
                if (discountModel) {
                    await discountModel.update({
                        where: { code: discountCode },
                        data: { usedCount: { increment: 1 } }
                    }).catch(() => null);
                } else {
                    await (db as any).$executeRaw`UPDATE DiscountCode SET usedCount = usedCount + 1 WHERE code = ${discountCode}`.catch(() => null);
                }
            }
        } else {
            // Fallback for JSON data
            try {
                await db.inquiry.create({
                    data
                });
            } catch (err: any) {
                if (err.message?.includes("Unknown argument")) {
                    const id = crypto.randomUUID();
                    await (db as any).$executeRaw`
                        INSERT INTO Inquiry (id, name, email, phone, service, message, address, appointmentDate, appointmentTime, discountCode, petImageUrl, status, read, createdAt, updatedAt)
                        VALUES (${id}, ${data.name}, ${data.email}, ${data.phone || null}, ${data.service || null}, ${data.message}, ${data.address || null}, ${data.appointmentDate ? new Date(data.appointmentDate).toISOString() : null}, ${data.appointmentTime || null}, ${data.discountCode || null}, ${data.petImageUrl || null}, 'PENDING', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `;
                } else {
                    throw err;
                }
            }
        }

        // Email Notification — always send to company email
        const targetEmail = process.env.SMTP_USER || "groomersincpetspa@gmail.com";
        
        const isForm = data instanceof FormData;
        const eName = isForm ? data.get("name") : data.name;
        const eEmail = isForm ? data.get("email") : data.email;
        const ePhone = isForm ? data.get("phone") : data.phone;
        const eService = isForm ? data.get("service") : data.service;
        const eMessage = isForm ? data.get("message") : data.message;
        const eAddress = isForm ? data.get("address") : data.address;
        const eDate = isForm ? data.get("appointmentDate") : data.appointmentDate;
        const eTime = isForm ? data.get("appointmentTime") : data.appointmentTime;
        const eDiscount = isForm ? (data.get("discountCode") as string)?.trim().toUpperCase() : data.discountCode;        const { sendEmail } = await import('@/lib/email');
        const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/es/login-admin`;

        const ePetImageUrl = petImageUrl || (isForm ? null : data.petImageUrl);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const absolutePetImageUrl = ePetImageUrl ? (ePetImageUrl.startsWith('http') ? ePetImageUrl : `${siteUrl}${ePetImageUrl}`) : null;

        const couponBlock = eDiscount ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="background:#121212;border:3px solid #000000;border-radius:14px;padding:14px 20px;box-shadow:4px 4px 0 #7C3AED;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">CUPÓN APLICADO</p>
            <p style="margin:6px 0 0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:3px;">${eDiscount}</p>
          </td>
        </tr>
      </table>` : '';

        const petImageBlock = absolutePetImageUrl ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="background:#242424;border:3px solid #000000;border-radius:14px;padding:20px;box-shadow:4px 4px 0 #000000;text-align:center;">
            <p style="margin:0 0 12px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;text-align:left;">FOTO DE LA MASCOTA</p>
            <div style="display:inline-block;border:3px solid #000000;border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 #000000;background:#121212;">
              <img src="${absolutePetImageUrl}" alt="Foto de la mascota" style="max-width:100%;max-height:220px;display:block;object-fit:cover;" />
            </div>
          </td>
        </tr>
      </table>` : '';

        await sendEmail({
            to: targetEmail,
            subject: `🐾 NUEVA CITA de ${eName} — GroomingPet`,
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
        🐾 GroomingPet &nbsp;·&nbsp; Admin Panel
      </div>
      <h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-1px;line-height:1.1;">
        NUEVA SOLICITUD
      </h1>
    </td>
  </tr>

  <tr>
    <td style="background:#000000;padding:16px 30px;text-align:center;border-bottom:4px solid #7C3AED;">
      <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:5px;color:#A78BFA;">CLIENTE</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#ffffff;text-transform:uppercase;">${eName}</p>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 28px 12px;">

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 20px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">CORREO ELECTRÓNICO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${eEmail}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="48%" style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">TELÉFONO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${ePhone || '—'}</p>
          </td>
          <td width="4%" style="font-size:0;">&nbsp;</td>
          <td width="48%" style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">SERVICIO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${eService || 'Consulta General'}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 20px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">DIRECCIÓN DE DOMICILIO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${eAddress || 'No proporcionada'}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td width="48%" style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">FECHA</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${eDate || 'No especificada'}</p>
          </td>
          <td width="4%" style="font-size:0;">&nbsp;</td>
          <td width="48%" style="background:#242424;border:3px solid #000000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">HORA</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#ffffff;">${eTime || 'No especificada'}</p>
          </td>
        </tr>
      </table>

      ${couponBlock}

      ${petImageBlock}

    </td>
  </tr>

  <tr>
    <td style="padding:4px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#242424;border:3px solid #000000;border-radius:18px 18px 18px 4px;padding:20px 22px;box-shadow:4px 4px 0 #000000;">
            <p style="margin:0 0 10px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#A78BFA;">MENSAJE / NOTAS</p>
            <p style="margin:0;font-size:15px;color:#E0E0E0;line-height:1.6;font-style:italic;">"${eMessage}"</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:8px 28px 40px;text-align:center;">
      <a href="${loginUrl}"
        style="display:inline-block;background:#7C3AED;color:#ffffff;font-size:18px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:2px;padding:18px 52px;border:3px solid #000000;border-radius:16px;box-shadow:5px 5px 0 #000000;">
        ENTRAR AL PANEL
      </a>
      <p style="margin:14px 0 0;font-size:11px;font-weight:700;color:#666666;letter-spacing:1px;text-transform:uppercase;">
        Inicia sesion para gestionar esta solicitud
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:#121212;padding:20px 28px;text-align:center;border-top:4px solid #000000;color:#666666;">
      <p style="margin:0;font-size:12px;font-weight:900;color:#7C3AED;text-transform:uppercase;letter-spacing:4px;">
        GroomingPet · Sistema de Gestion
      </p>
      <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#444444;letter-spacing:1px;">
        Este correo fue generado automaticamente.
      </p>
    </td>
  </tr>

 </table>
</td></tr>
</table>

</body>
</html>`
        });

        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error submitting inquiry:", error);
        return { success: false, error: "Failed to submit message" };
    }
}

export async function deleteInquiry(id: string) {
    try {
        await db.inquiry.update({
            where: { id },
            data: { deleted: true } as any
        });
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error soft deleting inquiry:", error);
        return { success: false, error: "Failed to delete inquiry" };
    }
}

export async function restoreInquiry(id: string) {
    try {
        await db.inquiry.update({
            where: { id },
            data: { deleted: false } as any
        });
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error restoring inquiry:", error);
        return { success: false, error: "Failed to restore inquiry" };
    }
}

export async function updateInquiryStatus(id: string, status: string) {
    try {
        const inquiry = await db.inquiry.findUnique({ where: { id } });
        if (!inquiry) {
            return { success: false, error: "Inquiry not found" };
        }

        await db.inquiry.update({ where: { id }, data: { status } as any });

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating inquiry status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function completeInquiryPayment(id: string, amount: number, description: string) {
    try {
        const inquiry = await db.inquiry.findUnique({ where: { id } });
        if (!inquiry) {
            return { success: false, error: "Inquiry not found" };
        }

        // Check if transaction already exists for this inquiry
        const existingTx = await (db as any).transaction.findFirst({
            where: { inquiryId: id }
        });

        if (!existingTx) {
            // Register INCOME
            await (db as any).transaction.create({
                data: {
                    type: "INCOME",
                    amount: amount,
                    description: description,
                    inquiryId: id,
                    date: new Date()
                }
            });
        }

        // Mark as COMPLETED
        await db.inquiry.update({ where: { id }, data: { status: "COMPLETED" } as any });

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error completing payment:", error);
        return { success: false, error: "Failed to complete payment" };
    }
}

export async function markInquiryAsRead(id: string, read: boolean = true) {
    try {
        await db.inquiry.update({ where: { id }, data: { read } as any });
        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking inquiry as read:", error);
        return { success: false, error: "Failed to mark as read" };
    }
}
