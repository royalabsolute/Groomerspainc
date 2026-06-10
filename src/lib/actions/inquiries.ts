"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";
import { isZipCodeSupported } from "@/lib/pricing";
import { headers } from "next/headers";
import { z } from "zod";

const petSchema = z.object({
    name: z.string().min(1),
    breed: z.string().min(1),
    weight: z.coerce.number().min(1).max(200),
    weightLbs: z.coerce.number().optional().nullable(),
    age: z.string().min(1),
    photoUrl: z.string().optional().nullable(),
    rabiesVaccinated: z.preprocess(
        (val) => val === true || val === "true",
        z.boolean().refine((v) => v === true)
    ),
    rabiesRegistry: z.string().optional().nullable(),
    shampooId: z.string().optional().nullable(),
    selectedServiceIds: z.array(z.string()).min(1),
});

const inquirySchema = z.object({
    ownerName: z.string().min(2),
    ownerEmail: z.string().email(),
    ownerPhone: z.string().min(10),
    address: z.string().min(5),
    zipCode: z.string().regex(/^\d{5}$/),
    appointmentDate: z.string().min(1),
    appointmentTime: z.string().min(1),
    discountCode: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    legalAccepted: z.boolean().refine((val) => val === true),
    pets: z.array(petSchema).min(1),
});

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

        const rawInput: any = {};
        // Check if data is FormData
        if (data instanceof FormData) {
            rawInput.ownerName = (data.get("ownerName") as string || data.get("name") as string || "").trim();
            rawInput.ownerEmail = (data.get("ownerEmail") as string || data.get("email") as string || "").trim();
            rawInput.ownerPhone = (data.get("ownerPhone") as string || data.get("phone") as string || "").trim();
            rawInput.address = (data.get("address") as string || "").trim();
            rawInput.zipCode = (data.get("zipCode") as string || "").trim();
            rawInput.legalAccepted = data.get("termsAccepted") === "true" || data.get("legalAccepted") === "true";
            rawInput.discountCode = (data.get("discountCode") as string || "").trim().toUpperCase();
            rawInput.message = (data.get("message") as string || "").trim();
            rawInput.appointmentDate = (data.get("appointmentDate") as string || "").trim();
            rawInput.appointmentTime = (data.get("appointmentTime") as string || "").trim();
            
            const petsJson = data.get("pets") as string;
            if (petsJson) {
                try {
                    rawInput.pets = JSON.parse(petsJson);
                } catch (e) {
                    console.error("Error parsing pets JSON:", e);
                    return { success: false, error: "validation_error" };
                }
            } else {
                rawInput.pets = [];
            }
        } else {
            // Fallback for JSON
            rawInput.ownerName = (data.ownerName || data.name || "").trim();
            rawInput.ownerEmail = (data.ownerEmail || data.email || "").trim();
            rawInput.ownerPhone = (data.ownerPhone || data.phone || "").trim();
            rawInput.address = (data.address || "").trim();
            rawInput.zipCode = (data.zipCode || "").trim();
            rawInput.legalAccepted = !!(data.termsAccepted || data.legalAccepted);
            rawInput.discountCode = (data.discountCode || "").trim().toUpperCase();
            rawInput.message = (data.message || "").trim();
            rawInput.appointmentDate = (data.appointmentDate || "").trim();
            rawInput.appointmentTime = (data.appointmentTime || "").trim();
            rawInput.pets = data.pets || [];
        }

        const parseResult = inquirySchema.safeParse(rawInput);
        if (!parseResult.success) {
            console.error("Zod Validation Error:", parseResult.error.format());
            return { success: false, error: "validation_error" };
        }

        const validated = parseResult.data;

        const ownerName = validated.ownerName;
        const ownerEmail = validated.ownerEmail;
        const ownerPhone = validated.ownerPhone;
        const address = validated.address;
        const zipCode = validated.zipCode;
        const city = "Miami";
        const termsAccepted = validated.legalAccepted;
        const discountCode = validated.discountCode || "";
        const message = validated.message || "";
        const appointmentDate = validated.appointmentDate;
        const appointmentTime = validated.appointmentTime;
        const petsData = validated.pets;
        const systemEstimatedPrice = isNaN(parseFloat(data.get ? data.get("systemEstimatedPrice") : data.systemEstimatedPrice)) 
            ? 0 
            : parseFloat(data.get ? data.get("systemEstimatedPrice") : data.systemEstimatedPrice);

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

            const parsedWeight = pet.weight || pet.weightLbs || 0;
            const parsedAge = pet.age ? parseInt(pet.age.toString(), 10) : null;

            uploadedPets.push({
                name: pet.name || "Perro",
                breed: pet.breed || "Mestizo",
                weightLbs: parsedWeight,
                ageYears: isNaN(Number(parsedAge)) ? null : parsedAge,
                photoUrl: petPhotoUrl,
                rabiesVaccineUpToDate: pet.rabiesVaccinated,
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
            const petServices = (pet.services || []).map((s: any) => `${s.nameEn}`).join(", ");
            petsInfoHtml += `
            <div style="border: 2px solid #7C3AED; padding: 12px; margin-bottom: 12px; border-radius: 10px; background: #262626;">
                <p style="margin: 4px 0;"><strong>Dog #${idx + 1}:</strong> ${pet.name} (${pet.breed}, ${pet.weightLbs} lbs, ${pet.ageYears !== null ? `${pet.ageYears} yr` : "N/A"})</p>
                <p style="margin: 4px 0;"><strong>Rabies Vaccine Up To Date:</strong> ${pet.rabiesVaccineUpToDate ? "YES" : "NO"}</p>
                ${pet.rabiesRegistry ? `<p style="margin: 4px 0;"><strong>Rabies Registry #:</strong> ${pet.rabiesRegistry}</p>` : ''}
                <p style="margin: 4px 0;"><strong>Services:</strong> ${petServices || "None"}</p>
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

            const emailContent = `New Request: ${ownerName} - ${quote.pets.length} Dog(s) on ${formattedDate} at ${appointmentTime || "N/A"}`;

            sendEmail({
                to: adminEmail,
                subject: emailContent,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #7C3AED; border-radius: 10px; background: #FFF; color: #111;">
                    <p style="font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">${emailContent}</p>
                    <hr style="border: 1px dashed #DDD;" />
                    <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">Please log in to the admin panel to review the full details.</p>
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
                    include: { services: true }
                }
            }
        });
        if (!quote) throw new Error("Quote not found");

        const petsList = quote.pets || [];
        const petNames = petsList.map((p: any) => p.name).join(", ") || "N/A";
        const petWeights = petsList.map((p: any) => `${p.name}: ${p.weightLbs} lbs`).join(", ") || "N/A";
        const price = Number(quote.finalAdminPrice || quote.systemEstimatedPrice);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groomersincathome.com";
        // Always use /en/ locale for outbound client links — English-only policy
        const acceptUrl = `${siteUrl}/en/quote/${quote.id}/accept`;

        // Build service breakdown HTML using English service names
        let servicesHtml = "";
        petsList.forEach((pet: any, idx: number) => {
            const petServices = (pet.services || []) as any[];
            const rows = petServices
                .map((s) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                padding:6px 0;border-bottom:1px solid #F0F0F0;font-size:13px;">
                        <span style="color:#333;">${s.nameEn}</span>
                        <span style="font-weight:700;color:#111;">$${Number(s.basePrice).toFixed(2)}</span>
                    </div>`)
                .join("");
            servicesHtml += `
            <div style="margin-bottom:12px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:900;text-transform:uppercase;
                           color:#7C3AED;letter-spacing:1px;">
                    Pet #${idx + 1}: ${pet.name} (${pet.breed}, ${pet.weightLbs} lbs)
                </p>
                ${rows || `<div style="font-size:13px;color:#888;">No specific services</div>`}
            </div>`;
        });

        // Use the dedicated English template
        const { quoteReadyTemplate } = await import("@/lib/templates/email-en/quote-ready");
        const { subject, html } = quoteReadyTemplate({
            ownerName: quote.ownerName,
            petNames,
            petWeights,
            servicesHtml,
            finalPrice: price,
            acceptUrl,
        });

        const { sendEmail } = await import("@/lib/email");
        const result = await sendEmail({ to: quote.ownerEmail, subject, html });

        if (!result.success) {
            console.error("[sendBilingualQuoteEmail] SMTP delivery failed:", result.error);
            return { success: false, error: result.error || "SMTP delivery failed" };
        }

        // Mark as PRICED
        await (db as any).quoteRequest.update({
            where: { id },
            data: { status: "PRICED" }
        });

        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (error: any) {
        console.error("[sendBilingualQuoteEmail] Unexpected error:", error);
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

export async function getInquiryForPrint(id: string) {
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
        
        if (!quote) {
            return { success: false, error: "Quote not found" };
        }
        
        let discountDetails = null;
        if (quote.discountCode) {
            discountDetails = await (db as any).discountCode.findFirst({
                where: { code: { equals: quote.discountCode } }
            });
        }
        
        return { success: true, quote, discountDetails };
    } catch (error: any) {
        console.error("Error fetching quote for print:", error);
        return { success: false, error: error.message || "Failed to fetch quote" };
    }
}


