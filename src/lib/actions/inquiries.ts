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
                        discountCode: discountCode || null,
                        petImageUrl
                    } as any
                });
            } catch (err: any) {
                if (err.message?.includes("Unknown argument `discountCode`")) {
                    const id = crypto.randomUUID();
                    await (db as any).$executeRaw`
                        INSERT INTO Inquiry (id, name, email, phone, service, message, discountCode, petImageUrl, status, read, createdAt, updatedAt)
                        VALUES (${id}, ${name}, ${email}, ${phone || null}, ${service || null}, ${message}, ${discountCode || null}, ${petImageUrl}, 'PENDING', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
                if (err.message?.includes("Unknown argument `discountCode`")) {
                    const id = crypto.randomUUID();
                    await (db as any).$executeRaw`
                        INSERT INTO Inquiry (id, name, email, phone, service, message, discountCode, petImageUrl, status, read, createdAt, updatedAt)
                        VALUES (${id}, ${data.name}, ${data.email}, ${data.phone || null}, ${data.service || null}, ${data.message}, ${data.discountCode || null}, ${data.petImageUrl || null}, 'PENDING', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `;
                } else {
                    throw err;
                }
            }
        }

        // Email Notification — always send to company email
        const targetEmail = "royalabsolute0@gmail.com";
        
        const isForm = data instanceof FormData;
        const eName = isForm ? data.get("name") : data.name;
        const eEmail = isForm ? data.get("email") : data.email;
        const ePhone = isForm ? data.get("phone") : data.phone;
        const eService = isForm ? data.get("service") : data.service;
        const eMessage = isForm ? data.get("message") : data.message;
        const eDiscount = isForm ? (data.get("discountCode") as string)?.trim().toUpperCase() : data.discountCode;

        const { sendEmail } = await import('@/lib/email');
        const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/es/login-admin`;

        const couponBlock = eDiscount ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:#000;border:3px solid #000;border-radius:14px;padding:14px 20px;box-shadow:4px 4px 0 #0d9488;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#0d9488;">CUPON APLICADO</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:4px;">${eDiscount}</p>
          </td>
        </tr>
      </table>` : '';

        await sendEmail({
            to: targetEmail,
            subject: `🐾 NUEVA CITA de ${eName} — GroomingPet`,
            html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FDFCF8;font-family:'Arial Black',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
  style="background-color:#FDFCF8;background-image:radial-gradient(circle,#00000012 1.5px,transparent 1.5px);background-size:18px 18px;padding:48px 20px;">
<tr><td align="center">

<table width="560" cellpadding="0" cellspacing="0"
  style="max-width:560px;width:100%;background:#ffffff;border:4px solid #000;border-radius:28px;overflow:hidden;box-shadow:10px 10px 0px 0px #000;">

  <tr>
    <td style="background:#0d9488;border-bottom:4px solid #000;padding:32px 30px 28px;text-align:center;">
      <div style="display:inline-block;background:#ffffff;color:#000;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;padding:5px 16px;border:3px solid #000;border-radius:100px;box-shadow:3px 3px 0 #000;margin-bottom:20px;">
        🐾 GroomingPet &nbsp;·&nbsp; Nueva Notificacion
      </div>
      <div style="background:#000;display:inline-block;border-radius:16px;padding:14px 36px;box-shadow:6px 6px 0 rgba(255,255,255,0.25);">
        <h1 style="margin:0;font-size:38px;font-weight:900;color:#0d9488;text-transform:uppercase;letter-spacing:-1px;line-height:1;">
          NUEVA CITA!
        </h1>
      </div>
    </td>
  </tr>

  <tr>
    <td style="background:#000;border-bottom:4px solid #000;padding:20px 30px;text-align:center;">
      <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:5px;color:#0d9488;">SOLICITUD DE</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:-1px;">${eName}</p>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 28px 12px;">

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td style="background:#f0fdfa;border:3px solid #000;border-radius:14px;padding:14px 20px;box-shadow:4px 4px 0 #000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#0d9488;">EMAIL</p>
            <p style="margin:6px 0 0;font-size:17px;font-weight:900;color:#000;">${eEmail}</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td width="48%" style="background:#f8f8f8;border:3px solid #000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#444;">TELEFONO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:900;color:#000;">${ePhone || '—'}</p>
          </td>
          <td width="4%" style="font-size:0;">&nbsp;</td>
          <td width="48%" style="background:#f0fdfa;border:3px solid #000;border-radius:14px;padding:14px 18px;box-shadow:4px 4px 0 #000;">
            <p style="margin:0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#0d9488;">SERVICIO</p>
            <p style="margin:6px 0 0;font-size:16px;font-weight:900;color:#000;">${eService || 'Consulta General'}</p>
          </td>
        </tr>
      </table>

      ${couponBlock}

    </td>
  </tr>

  <tr>
    <td style="padding:4px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f8f8f8;border:3px solid #000;border-radius:18px 18px 18px 4px;padding:20px 22px;box-shadow:4px 4px 0 #000;">
            <p style="margin:0 0 10px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#0d9488;">MENSAJE</p>
            <p style="margin:0;font-size:16px;color:#111;line-height:1.65;font-style:italic;font-weight:600;">"${eMessage}"</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:8px 28px 40px;text-align:center;">
      <a href="${loginUrl}"
        style="display:inline-block;background:#0d9488;color:#ffffff;font-size:18px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:2px;padding:18px 52px;border:4px solid #000;border-radius:16px;box-shadow:7px 7px 0 #000;">
        ENTRAR AL PANEL
      </a>
      <p style="margin:14px 0 0;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;">
        Inicia sesion para gestionar esta solicitud
      </p>
    </td>
  </tr>

  <tr>
    <td style="background:#000;padding:20px 28px;text-align:center;border-top:4px solid #000;">
      <p style="margin:0;font-size:13px;font-weight:900;color:#0d9488;text-transform:uppercase;letter-spacing:4px;">
        GroomingPet · Sistema de Gestion
      </p>
      <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#444;letter-spacing:1px;">
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
        await db.inquiry.delete({ where: { id } });
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error deleting inquiry:", error);
        return { success: false, error: "Failed to delete inquiry" };
    }
}

export async function updateInquiryStatus(id: string, status: string) {
    try {
        const inquiry = await db.inquiry.findUnique({ where: { id } });
        if (!inquiry) {
            return { success: false, error: "Inquiry not found" };
        }

        await db.inquiry.update({ where: { id }, data: { status } as any });

        if (status === "ACCEPTED") {
            // Check if transaction already exists for this inquiry
            const existingTx = await (db as any).transaction.findFirst({
                where: { inquiryId: id }
            });

            if (!existingTx) {
                let amount = 50; // fallback price
                if (inquiry.service) {
                    const matchedService = await db.service.findFirst({
                        where: {
                            OR: [
                                { titleEs: inquiry.service },
                                { titleEn: inquiry.service }
                            ]
                        }
                    });
                    if (matchedService && matchedService.price) {
                        amount = Number(matchedService.price);
                    }
                }

                // Register INCOME
                await (db as any).transaction.create({
                    data: {
                        type: "INCOME",
                        amount: amount,
                        description: `Servicio Aceptado: ${inquiry.service || "Grooming"} — Cliente: ${inquiry.name}`,
                        inquiryId: id,
                        date: new Date()
                    }
                });
            }
        }

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating inquiry status:", error);
        return { success: false, error: "Failed to update status" };
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
