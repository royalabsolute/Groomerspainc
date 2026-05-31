"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";
import { isZipCodeSupported } from "@/lib/pricing";
import { headers } from "next/headers";

// Rate limiter in memory: Map of IP address -> array of request timestamps (ms)
const rateLimitMap = new Map<string, number[]>();

export async function submitInquiry(data: any) {
    try {
        let ip = "127.0.0.1";
        try {
            const headersList = await headers();
            ip = headersList.get("x-forwarded-for")?.split(",")[0] || 
                 headersList.get("x-real-ip") || 
                 "127.0.0.1";
        } catch (e) {
            console.warn("Could not retrieve IP from headers, using fallback.", e);
        }

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000; // 1 hour in ms

        const clientRequests = rateLimitMap.get(ip) || [];
        // Filter out requests older than 1 hour
        const recentRequests = clientRequests.filter(timestamp => timestamp > oneHourAgo);

        if (recentRequests.length >= 3) {
            return { success: false, error: "Rate limit exceeded" };
        }

        // Add current request timestamp
        recentRequests.push(now);
        rateLimitMap.set(ip, recentRequests);
        let ownerName = "";
        let ownerEmail = "";
        let ownerPhone = "";
        let address = "";
        let zipCode = "";
        let city = "Miami";
        let termsAccepted = false;
        let discountCode = "";
        let message = "";
        let appointmentDate = "";
        let appointmentTime = "";
        let systemEstimatedPrice = 0;
        let petsData: any[] = [];

        // Check if data is FormData
        if (data instanceof FormData) {
            ownerName = (data.get("ownerName") as string || data.get("name") as string || "").trim();
            ownerEmail = (data.get("ownerEmail") as string || data.get("email") as string || "").trim();
            ownerPhone = (data.get("ownerPhone") as string || data.get("phone") as string || "").trim();
            address = (data.get("address") as string || "").trim();
            zipCode = (data.get("zipCode") as string || "").trim();
            city = (data.get("city") as string || "Miami").trim();
            termsAccepted = data.get("termsAccepted") === "true" || data.get("legalAccepted") === "true";
            discountCode = (data.get("discountCode") as string || "").trim().toUpperCase();
            message = (data.get("message") as string || "").trim();
            appointmentDate = (data.get("appointmentDate") as string || "").trim();
            appointmentTime = (data.get("appointmentTime") as string || "").trim();
            
            const estPriceVal = parseFloat(data.get("systemEstimatedPrice") as string || "0");
            systemEstimatedPrice = isNaN(estPriceVal) ? 0 : estPriceVal;

            const petsJson = data.get("pets") as string;
            if (petsJson) {
                try {
                    petsData = JSON.parse(petsJson);
                } catch (e) {
                    console.error("Error parsing pets JSON:", e);
                }
            }
        } else {
            // Fallback for JSON
            ownerName = (data.ownerName || data.name || "").trim();
            ownerEmail = (data.ownerEmail || data.email || "").trim();
            ownerPhone = (data.ownerPhone || data.phone || "").trim();
            address = (data.address || "").trim();
            zipCode = (data.zipCode || "").trim();
            city = (data.city || "Miami").trim();
            termsAccepted = !!(data.termsAccepted || data.legalAccepted);
            discountCode = (data.discountCode || "").trim().toUpperCase();
            message = (data.message || "").trim();
            appointmentDate = (data.appointmentDate || "").trim();
            appointmentTime = (data.appointmentTime || "").trim();
            
            const estPriceVal = parseFloat(data.systemEstimatedPrice || "0");
            systemEstimatedPrice = isNaN(estPriceVal) ? 0 : estPriceVal;
            petsData = data.pets || [];
        }

        // 1. Coverage Check
        if (!isZipCodeSupported(zipCode)) {
            return { success: false, error: "no_coverage" };
        }

        // 2. Process pets and upload photos for each pet
        const uploadedPets = [];
        for (let i = 0; i < petsData.length; i++) {
            const pet = petsData[i];
            let petPhotoUrl = null;

            if (data instanceof FormData) {
                const rawPetImage = data.get(`petImage_${i}`) as File;
                if (rawPetImage && rawPetImage.size > 0) {
                    if (rawPetImage.size > 5 * 1024 * 1024) {
                        return { success: false, error: "file_too_large" };
                    }
                    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
                    if (!allowedTypes.includes(rawPetImage.type)) {
                        return { success: false, error: "invalid_file_type" };
                    }

                    const bytes = await rawPetImage.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const fileName = `${Date.now()}_pet_${i}_${rawPetImage.name.replace(/\s+/g, '_')}`;
                    const uploadDir = path.join(process.cwd(), "public", "uploads", "inquiries");
                    
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    const filePath = path.join(uploadDir, fileName);
                    await writeFile(filePath, buffer);
                    petPhotoUrl = `/api/uploads/inquiries/${fileName}`;
                }
            } else if (pet.photoUrl) {
                petPhotoUrl = pet.photoUrl;
            }

            const parsedWeight = parseFloat(pet.weight || pet.weightLbs || "0");
            const parsedAge = pet.age ? parseInt(pet.age.toString(), 10) : null;

            uploadedPets.push({
                name: pet.name || "Perro",
                breed: pet.breed || "Mestizo",
                weightLbs: isNaN(parsedWeight) ? 0 : parsedWeight,
                ageYears: isNaN(Number(parsedAge)) ? null : parsedAge,
                photoUrl: petPhotoUrl,
                rabiesVaccineUpToDate: pet.rabiesVaccinated === true || pet.rabiesVaccinated === "true",
                rabiesRegistry: pet.rabiesRegistry || null,
                shampooId: pet.shampooId || null,
                services: {
                    connect: (pet.selectedServiceIds || []).map((id: string) => ({ id }))
                }
            });
        }

        // 3. Persist QuoteRequest and PetProfiles
        const quote = await (db as any).quoteRequest.create({
            data: {
                ownerName,
                ownerPhone,
                ownerEmail,
                address,
                zipCode,
                city,
                termsAccepted,
                systemEstimatedPrice,
                message: message || null,
                discountCode: discountCode || null,
                status: "PENDING_REVIEW",
                read: false,
                appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
                appointmentTime: appointmentTime || null,
                pets: {
                    create: uploadedPets
                }
            },
            include: {
                pets: {
                    include: {
                        services: true
                    }
                }
            }
        });

        // 4. Construct service names and pet info list for Admin Email
        let petsInfoHtml = "";
        (quote.pets || []).forEach((pet: any, idx: number) => {
            const petServices = (pet.services || []).map((s: any) => `${s.nameEs} (${s.nameEn})`).join(", ");
            petsInfoHtml += `
            <div style="border: 2px solid #7C3AED; padding: 12px; margin-bottom: 12px; border-radius: 10px; background: #262626;">
                <p style="margin: 4px 0;"><strong>Perro #${idx + 1}:</strong> ${pet.name} (${pet.breed}, ${pet.weightLbs} lbs, ${pet.ageYears !== null ? `${pet.ageYears} años` : "N/A"})</p>
                <p style="margin: 4px 0;"><strong>Vacuna de Rabia al día:</strong> ${pet.rabiesVaccineUpToDate ? "✅ SÍ" : "❌ NO"}</p>
                ${pet.rabiesRegistry ? `<p style="margin: 4px 0;"><strong>Num. Registro Rabia:</strong> ${pet.rabiesRegistry}</p>` : ''}
                <p style="margin: 4px 0;"><strong>Servicios:</strong> ${petServices || "Ninguno"}</p>
            </div>
            `;
        });

        // 5. Send Admin Notification Email (asynchronous, in try/catch to avoid blocking user flow)
        try {
            let adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "groomersincpetspa@gmail.com";
            if (adminEmail.includes("<")) {
                const match = adminEmail.match(/<([^>]+)>/);
                if (match) {
                    adminEmail = match[1];
                }
            }
            const { sendEmail } = await import('@/lib/email');
            
            let formattedDate = "N/A";
            if (appointmentDate) {
                try {
                    const d = new Date(appointmentDate);
                    formattedDate = d.toISOString().split('T')[0];
                } catch {
                    formattedDate = appointmentDate;
                }
            }

            const emailContent = `Nueva Solicitud: ${ownerName} - ${quote.pets.length} Perros para el ${formattedDate} a las ${appointmentTime || "N/A"}`;

            sendEmail({
                to: adminEmail,
                subject: emailContent,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #7C3AED; border-radius: 10px; background: #FFF; color: #111;">
                    <p style="font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">${emailContent}</p>
                    <hr style="border: 1px dashed #DDD;" />
                    <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">Por favor, inicia sesión en el panel de administración para ver la información completa.</p>
                </div>
                `
            }).catch(emailError => {
                console.error("Error sending admin email inside catch:", emailError);
            });
        } catch (emailError) {
            console.error("Error sending admin notification email:", emailError);
        }

        revalidatePath("/admin/inquiries");
        return { success: true, quoteId: quote.id };
    } catch (error) {
        console.error("Error submitting quote request:", error);
        return { success: false, error: "server_error" };
    }
}


export async function deleteInquiry(id: string) {
    try {
        await (db as any).quoteRequest.delete({
            where: { id }
        });
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error deleting quote request:", error);
        return { success: false, error: "Failed to delete request" };
    }
}

export async function permanentDeleteInquiry(id: string) {
    return deleteInquiry(id);
}

export async function ensureTransactionForQuote(id: string) {
    try {
        const quote = await (db as any).quoteRequest.findUnique({
            where: { id },
            include: {
                pets: true
            }
        });
        if (!quote) return;

        // Check if an INCOME transaction already exists for this inquiryId
        const existingTx = await (db as any).transaction.findFirst({
            where: {
                inquiryId: id,
                type: "INCOME"
            }
        });

        const amount = Number(quote.finalAdminPrice || quote.systemEstimatedPrice || 0);
        const petNames = quote.pets?.map((p: any) => p.name).join(", ") || "mascota";
        const description = `Servicio de Estética para ${quote.ownerName} (${petNames})`;

        if (existingTx) {
            // Update the amount if it has changed
            if (Number(existingTx.amount) !== amount) {
                await (db as any).transaction.update({
                    where: { id: existingTx.id },
                    data: { amount }
                });
            }
        } else {
            // Create a new income transaction
            await (db as any).transaction.create({
                data: {
                    type: "INCOME",
                    amount,
                    description,
                    inquiryId: id,
                    date: new Date()
                }
            });
        }
    } catch (err) {
        console.error("Error in ensureTransactionForQuote:", err);
    }
}

export async function updateInquiryStatus(id: string, status: any) {
    try {
        await (db as any).quoteRequest.update({
            where: { id },
            data: { status }
        });

        if (status === "CONFIRMED" || status === "COMPLETED") {
            await ensureTransactionForQuote(id);
        }

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating quote status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function saveAdminFinalPrice(id: string, finalAdminPrice: number) {
    try {
        const quote = await (db as any).quoteRequest.update({
            where: { id },
            data: {
                finalAdminPrice: finalAdminPrice,
                status: "PRICED",
                read: true
            }
        });
        revalidatePath("/admin/inquiries");
        return { success: true, quote };
    } catch (error) {
        console.error("Error saving admin final price:", error);
        return { success: false, error: "Failed to save adjusted price" };
    }
}

export async function sendBilingualQuoteEmail(id: string) {
    try {
        const quote = await (db as any).quoteRequest.findUnique({
            where: { id },
            include: {
                pets: {
                    include: {
                        services: true
                    }
                }
            }
        });
        if (!quote) throw new Error("Quote not found");

        const petsList = quote.pets || [];
        const petNames = petsList.map((p: any) => p.name).join(", ") || "N/A";
        const petWeights = petsList.map((p: any) => `${p.name}: ${p.weightLbs} lbs`).join(", ") || "N/A";

        // Build Spanish breakdown
        let listEs = "";
        petsList.forEach((pet: any, idx: number) => {
            const petServices = pet.services || [];
            const servicesListEs = petServices.map((s: any) => `<li>${s.nameEs} - <strong>$${Number(s.basePrice).toFixed(2)}</strong></li>`).join("");
            listEs += `
            <div style="margin-bottom: 12px; border-left: 4px solid #7C3AED; padding-left: 10px;">
                <p style="margin: 0 0 4px; font-weight: bold; font-size: 14px;">Perro #${idx + 1}: ${pet.name} (${pet.breed}, ${pet.weightLbs} lbs)</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #333;">
                    ${servicesListEs || `<li>Sin servicios específicos</li>`}
                </ul>
            </div>`;
        });

        // Build English breakdown
        let listEn = "";
        petsList.forEach((pet: any, idx: number) => {
            const petServices = pet.services || [];
            const servicesListEn = petServices.map((s: any) => `<li>${s.nameEn} - <strong>$${Number(s.basePrice).toFixed(2)}</strong></li>`).join("");
            listEn += `
            <div style="margin-bottom: 12px; border-left: 4px solid #7C3AED; padding-left: 10px;">
                <p style="margin: 0 0 4px; font-weight: bold; font-size: 14px;">Pet #${idx + 1}: ${pet.name} (${pet.breed}, ${pet.weightLbs} lbs)</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #333;">
                    ${servicesListEn || `<li>No specific services</li>`}
                </ul>
            </div>`;
        });

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groomersincpetspa.com";
        const acceptUrl = `${siteUrl}/es/quote/${quote.id}/accept`; // links to acceptance page

        const price = Number(quote.finalAdminPrice || quote.systemEstimatedPrice);

        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 4px solid #000; border-radius: 16px; background: #FFF; color: #111; box-shadow: 6px 6px 0 #7C3AED;">
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Groomers Inc.</h1>
                <p style="margin: 4px 0 0; font-size: 12px; font-weight: bold; color: #7C3AED; text-transform: uppercase; letter-spacing: 2px;">
                    Florida Mobile Pet Grooming Spa
                </p>
            </div>

            <!-- Spanish Version -->
            <div style="margin-bottom: 30px; border-bottom: 1px dashed #DDD; padding-bottom: 24px;">
                <p>¡Hola <strong>${quote.ownerName}</strong>!</p>
                <p>Tu cotización para consentir a <strong>${petNames}</strong> ha sido revisada por nuestro especialista de spa móvil. A continuación verás el desglose final oficial:</p>
                <div style="background: #FAFAFA; border: 2px solid #000; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    ${listEs}
                    <p style="margin: 12px 0 0; font-size: 16px; font-weight: bold; color: #7C3AED;">
                        Precio Final Oficial: $${price.toFixed(2)}
                    </p>
                </div>
                <p style="font-size: 12px; color: #666;">
                    * Este precio incluye el recargo por traslado y la base por peso (${petWeights}).
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 28px; background: #2ECC71; color: #000; font-weight: 900; text-decoration: none; border-radius: 12px; border: 3px solid #000; box-shadow: 4px 4px 0 #000; text-transform: uppercase; font-size: 14px;">
                        Aceptar Cotización y Agendar Cita
                    </a>
                </div>
            </div>

            <!-- English Version -->
            <div>
                <p>Hello <strong>${quote.ownerName}</strong>!</p>
                <p>Your spa quote to pamper <strong>${petNames}</strong> has been reviewed by our mobile spa specialist. Here is the official final price breakdown:</p>
                <div style="background: #FAFAFA; border: 2px solid #000; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    ${listEn}
                    <p style="margin: 12px 0 0; font-size: 16px; font-weight: bold; color: #7C3AED;">
                        Official Final Price: $${price.toFixed(2)}
                    </p>
                </div>
                <p style="font-size: 12px; color: #666;">
                    * This price includes travel surcharge and weight-based rate (${petWeights}).
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 28px; background: #2ECC71; color: #000; font-weight: 900; text-decoration: none; border-radius: 12px; border: 3px solid #000; box-shadow: 4px 4px 0 #000; text-transform: uppercase; font-size: 14px;">
                        Accept Quote & Book Appointment
                    </a>
                </div>
            </div>
        </div>
        `;

        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
            to: quote.ownerEmail,
            subject: `Tu Cotización Oficial de GroomingPet / Your Official GroomingPet Spa Quote`,
            html: emailHtml
        });

        // Update status to keep track
        await (db as any).quoteRequest.update({
            where: { id },
            data: { status: "PRICED" }
        });

        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error: any) {
        console.error("Error sending bilingual quote email:", error);
        return { success: false, error: error.message || "Failed to send email" };
    }
}

export async function markInquiryAsRead(id: string, read: boolean = true) {
    try {
        await (db as any).quoteRequest.update({
            where: { id },
            data: { read }
        });
        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error) {
        console.error("Error marking request as read:", error);
        return { success: false, error: "Failed to update read state" };
    }
}

export async function completeInquiryPayment(id: string, amount: number, description: string) {
    try {
        await (db as any).quoteRequest.update({
            where: { id },
            data: { status: "COMPLETED" }
        });

        await ensureTransactionForQuote(id);

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error completing payment:", error);
        return { success: false, error: "Failed to complete payment" };
    }
}

export async function completeInquiryWithLegal(formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const groomerNotes = formData.get("groomerNotes") as string || "";
        const file = formData.get("contract") as File;

        if (!id) {
            return { success: false, error: "ID de cotización requerido" };
        }
        if (!file || file.size === 0) {
            return { success: false, error: "Contrato firmado es obligatorio" };
        }

        // Subir archivo localmente
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), "public", "uploads", "contracts");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);
        const contractUrl = `/api/uploads/contracts/${filename}`;

        // Obtener cotización para calcular precio final
        const quote = await (db as any).quoteRequest.findUnique({
            where: { id },
            include: { pets: true }
        });
        if (!quote) {
            return { success: false, error: "Cita no encontrada" };
        }

        const amount = Number(quote.finalAdminPrice || quote.systemEstimatedPrice || 0);
        const petNames = quote.pets?.map((p: any) => p.name).join(", ") || "mascota";
        const description = `Servicio de Estética para ${quote.ownerName} (${petNames})`;

        // Buscar transacción existente de tipo INCOME para esta cita
        const existingTx = await (db as any).transaction.findFirst({
            where: {
                inquiryId: id,
                type: "INCOME"
            }
        });

        const txOperation = existingTx
            ? (db as any).transaction.update({
                where: { id: existingTx.id },
                data: {
                    amount,
                    description,
                    date: new Date()
                }
            })
            : (db as any).transaction.create({
                data: {
                    type: "INCOME",
                    amount,
                    description,
                    inquiryId: id,
                    date: new Date()
                }
            });

        // Transacción de base de datos atómica
        await (db as any).$transaction([
            (db as any).quoteRequest.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    contractUrl,
                    groomerNotes
                }
            }),
            txOperation
        ]);

        revalidatePath("/admin/inquiries");
        revalidatePath("/admin/finanzas");
        revalidatePath("/admin/dashboard");

        return { success: true, contractUrl };
    } catch (error: any) {
        console.error("Error in completeInquiryWithLegal Server Action:", error);
        return { success: false, error: error.message || "Error del servidor" };
    }
}

