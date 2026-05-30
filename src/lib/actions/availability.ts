"use server";

import db from "@/lib/db";

export async function getAvailableHours(dateString: string) {
    try {
        // Obtenemos la configuración de horas y días del administrador
        const config = await db.siteConfig.findUnique({
            where: { id: "config" },
            select: {
                workingHoursStart: true,
                workingHoursEnd: true,
                workingDays: true,
                blockedDates: true
            }
        });

        if (!config) return { success: false, error: "Configuration not found" };

        const { workingHoursStart, workingHoursEnd, workingDays, blockedDates } = config;

        // Comprobamos si la fecha completa está bloqueada
        if (blockedDates && blockedDates.includes(dateString)) {
            return { success: true, availableHours: [] };
        }

        // Comprobamos si el día de la semana es laborable (0 = Domingo, 1 = Lunes...)
        const selectedDate = new Date(dateString);
        // JS Date usa UTC al parsear YYYY-MM-DD. Ajustamos para sacar el día de la semana correcto.
        const dayOfWeek = selectedDate.getUTCDay().toString(); 
        
        if (workingDays && !workingDays.split(",").includes(dayOfWeek)) {
            return { success: true, availableHours: [] };
        }

        // Generamos todas las horas posibles entre el inicio y el fin (en bloques de 1 hora)
        const startHour = parseInt((workingHoursStart || "09:00").split(":")[0]);
        const endHour = parseInt((workingHoursEnd || "18:00").split(":")[0]);
        
        const allHours = [];
        for (let i = startHour; i < endHour; i++) {
            const hourString = `${i.toString().padStart(2, '0')}:00`;
            allHours.push(hourString);
        }

        // Consultamos las citas existentes para ese día que estén PENDING o CONFIRMED
        // Parseamos la fecha para que cubra todo el día en UTC
        const startDate = new Date(dateString);
        const endDate = new Date(dateString);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const existingInquiries = await (db as any).quoteRequest.findMany({
            where: {
                appointmentDate: {
                    gte: startDate,
                    lt: endDate
                },
                status: {
                    in: ["PENDING_REVIEW", "PRICED", "CONFIRMED"]
                }
            },
            select: {
                appointmentTime: true
            }
        });

        const bookedHours = existingInquiries.map((inquiry: any) => inquiry.appointmentTime);

        // Filtramos las horas ya ocupadas
        let availableHours = allHours.filter(hour => !bookedHours.includes(hour));

        // Opcional/Recomendado: Filtrar horas del pasado si la reserva es para "hoy"
        const now = new Date();
        const todayYear = now.getFullYear();
        const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
        const todayDay = String(now.getDate()).padStart(2, '0');
        const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

        if (dateString === todayStr) {
            const currentHour = now.getHours();
            // Filtra dejando solo las horas mayores a la hora actual
            // Ej: Si son las 14:30, solo muestra de las 15:00 en adelante
            availableHours = availableHours.filter(hourStr => {
                const hourInt = parseInt(hourStr.split(":")[0]);
                return hourInt > currentHour;
            });
        }

        return { success: true, availableHours };
    } catch (error) {
        console.error("Error getting available hours:", error);
        return { success: false, error: "Error interno al cargar la disponibilidad" };
    }
}
