"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ensureTransactionForQuote } from "@/lib/actions/inquiries";

/**
 * Called when client clicks the "Accept Quote" button.
 * Confirms the appointment and sends a confirmation email in English.
 */
export async function acceptQuoteAndNotify(quoteId: string) {
    try {
        const quote = await (db as any).quoteRequest.findUnique({
            where: { id: quoteId },
            include: {
                pets: { include: { services: true } }
            }
        });

        if (!quote) {
            return { success: false, error: "Quote not found" };
        }

        // Mark as CONFIRMED (idempotent)
        if (quote.status !== "CONFIRMED" && quote.status !== "COMPLETED") {
            await (db as any).quoteRequest.update({
                where: { id: quoteId },
                data: { status: "CONFIRMED" }
            });
            await ensureTransactionForQuote(quoteId);
        }

        // Build pet names
        const petsList = quote.pets || [];
        const petNames = petsList.map((p: any) => p.name).join(", ") || quote.petName || "Your pet";
        const price = Number(quote.finalAdminPrice || quote.systemEstimatedPrice);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groomersincathome.com";

        // Send English-only confirmation email (non-blocking)
        try {
            const { appointmentConfirmedTemplate } = await import(
                "@/lib/templates/email-en/appointment-confirmed"
            );
            const { sendEmail } = await import("@/lib/email");

            const { subject, html } = appointmentConfirmedTemplate({
                ownerName: quote.ownerName,
                petNames,
                address: quote.address,
                zipCode: quote.zipCode,
                appointmentDate: quote.appointmentDate,
                appointmentTime: quote.appointmentTime,
                finalPrice: price,
                siteUrl,
            });

            const result = await sendEmail({ to: quote.ownerEmail, subject, html });

            if (!result.success) {
                // Log but don't block — appointment is still confirmed
                console.error(
                    "[acceptQuoteAndNotify] Confirmation email failed (non-fatal):",
                    result.error
                );
            } else {
                console.log(
                    `[acceptQuoteAndNotify] Confirmation email sent to ${quote.ownerEmail}`
                );
            }
        } catch (emailErr) {
            console.error("[acceptQuoteAndNotify] Email error (non-fatal):", emailErr);
        }

        revalidatePath("/admin/inquiries");
        return { success: true };
    } catch (err: any) {
        console.error("[acceptQuoteAndNotify] Error:", err);
        return { success: false, error: err.message || "Server error" };
    }
}
