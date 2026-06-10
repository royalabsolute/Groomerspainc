/**
 * WHATSAPP TEMPLATES (English Only)
 * All templates are plain-text, pre-formatted messages for wa.me deep links.
 * These are NOT WhatsApp Business API registered templates (no provider needed).
 * They are pre-written messages opened in WhatsApp Web via the groomer's phone.
 *
 * Language: ENGLISH ONLY — regardless of client locale.
 */

export interface QuoteReadyWAData {
    ownerName: string;
    petName: string;          // First pet or comma-list
    serviceNames: string;     // English service names
    finalPrice: number;
    acceptUrl: string;
}

export interface AppointmentConfirmedWAData {
    ownerName: string;
    petName: string;
    appointmentDate: string | null;
    appointmentTime: string | null;
    address: string;
}

export interface ReminderWAData {
    ownerName: string;
    petName: string;
    appointmentDate: string;
    appointmentTime: string;
}

/** Quote ready message — groomer sends this after setting final price */
export function quoteReadyMessage(data: QuoteReadyWAData): string {
    const { ownerName, petName, serviceNames, finalPrice, acceptUrl } = data;
    return [
        `Hello ${ownerName}! 🐾`,
        ``,
        `Your grooming quote for *${petName}* is ready from *Groomers, INC.*`,
        ``,
        `📋 *Services Included:*`,
        `${serviceNames || "Professional Grooming"}`,
        ``,
        `💰 *Official Price: $${finalPrice.toFixed(2)}*`,
        `(Cash only upon service completion)`,
        ``,
        `✅ *Accept & confirm your appointment:*`,
        `${acceptUrl}`,
        ``,
        `Questions? Reply to this message.`,
        `Thank you for choosing Groomers, INC.! 🐶`,
    ].join("\n");
}

/** Confirmation message after client accepts the quote */
export function appointmentConfirmedMessage(data: AppointmentConfirmedWAData): string {
    const { ownerName, petName, appointmentDate, appointmentTime, address } = data;
    const dateStr = appointmentDate
        ? new Date(appointmentDate).toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
          })
        : "TBD";
    return [
        `Hello ${ownerName}! ✅`,
        ``,
        `Your appointment for *${petName}* with *Groomers, INC.* is *CONFIRMED*.`,
        ``,
        `📅 *Date:* ${dateStr}`,
        `🕐 *Arrival:* ${appointmentTime || "To be confirmed"}`,
        `📍 *Address:* ${address}`,
        ``,
        `Please have ready:`,
        `• Rabies vaccine certificate (FL law required)`,
        `• Cash payment for the groomer`,
        `• Pet(s) accessible at your door`,
        ``,
        `See you soon! 🐾 — Groomers, INC. Team`,
    ].join("\n");
}

/** Day-before reminder */
export function appointmentReminderMessage(data: ReminderWAData): string {
    const { ownerName, petName, appointmentDate, appointmentTime } = data;
    return [
        `Hi ${ownerName}! 👋`,
        ``,
        `This is a friendly reminder that your grooming appointment for *${petName}* is *TOMORROW*.`,
        ``,
        `📅 *${appointmentDate}* at *${appointmentTime}*`,
        ``,
        `Please have your rabies vaccine certificate and cash payment ready.`,
        ``,
        `Reply to this message if you need to reschedule.`,
        `— Groomers, INC. Team 🐶`,
    ].join("\n");
}

/**
 * Build a wa.me deep link from a phone number and message.
 * Normalizes US phone numbers to E.164 format (adds +1 if 10 digits).
 */
export function buildWhatsAppLink(phone: string, message: string): string {
    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10) clean = "1" + clean;        // Add US country code
    if (!clean.startsWith("1") && clean.length === 11) {
        // Already has country code
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
