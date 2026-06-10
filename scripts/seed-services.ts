import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
    // --- CATEGORY: BATH ONLY (MAIN_GROOMING) ---
    {
        nameEn: "Bath Only - Small (Bath, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Solo Baño - Pequeño (Baño, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 85,
        isActive: true,
    },
    {
        nameEn: "Bath Only - Medium (Bath, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Solo Baño - Mediano (Baño, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 90,
        isActive: true,
    },
    {
        nameEn: "Bath Only - Large (Bath, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Solo Baño - Grande (Baño, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 100,
        isActive: true,
    },

    // --- CATEGORY: BATH & HAIRCUT (MAIN_GROOMING) ---
    {
        nameEn: "Bath & Haircut - Small (Bath, Haircut, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Baño y Corte - Pequeño (Baño, Corte de Pelo, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 85,
        isActive: true,
    },
    {
        nameEn: "Bath & Haircut - Medium (Bath, Haircut, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Baño y Corte - Mediano (Baño, Corte de Pelo, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 90,
        isActive: true,
    },
    {
        nameEn: "Bath & Haircut - Large (Bath, Haircut, Ear Cleaning, Nail Trim, Teeth Brushing, Gland Expression)",
        nameEs: "Baño y Corte - Grande (Baño, Corte de Pelo, Limpieza de Oídos, Corte de Uñas, Cepillado de Dientes, Glándulas)",
        category: "MAIN_GROOMING",
        basePrice: 120,
        isActive: true,
    },

    // --- CATEGORY: GROOMING + MASSAGE (MAIN_GROOMING) ---
    {
        nameEn: "Grooming + Massage - Small (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Relaxing Massage)",
        nameEs: "Grooming y Masaje - Pequeño (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje Relajante)",
        category: "MAIN_GROOMING",
        basePrice: 85,
        isActive: true,
    },
    {
        nameEn: "Grooming + Massage - Medium (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Relaxing Massage)",
        nameEs: "Grooming y Masaje - Mediano (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje Relajante)",
        category: "MAIN_GROOMING",
        basePrice: 100,
        isActive: true,
    },
    {
        nameEn: "Grooming + Massage - Large (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Relaxing Massage)",
        nameEs: "Grooming y Masaje - Grande (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje Relajante)",
        category: "MAIN_GROOMING",
        basePrice: 130,
        isActive: true,
    },

    // --- CATEGORY: SOPHISTICATED GROOMING (AROMA) (MAIN_GROOMING) ---
    {
        nameEn: "Sophisticated Grooming - Small (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Massage, Aromatherapy)",
        nameEs: "Grooming de Lujo - Pequeño (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje, Aromaterapia)",
        category: "MAIN_GROOMING",
        basePrice: 100,
        isActive: true,
    },
    {
        nameEn: "Sophisticated Grooming - Medium (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Massage, Aromatherapy)",
        nameEs: "Grooming de Lujo - Mediano (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje, Aromaterapia)",
        category: "MAIN_GROOMING",
        basePrice: 120,
        isActive: true,
    },
    {
        nameEn: "Sophisticated Grooming - Large (Bath, Haircut, Ears, Nails, Teeth, Glands, Sanitary Trim, Massage, Aromatherapy)",
        nameEs: "Grooming de Lujo - Grande (Baño, Corte, Oídos, Uñas, Dientes, Glándulas, Corte Sanitario, Masaje, Aromaterapia)",
        category: "MAIN_GROOMING",
        basePrice: 150,
        isActive: true,
    },

    // --- CATEGORY: DENTAL (ADDON_TREATMENT) ---
    {
        nameEn: "Dental Heavy Plaque Removal",
        nameEs: "Eliminación de Sarro Severo",
        category: "ADDON_TREATMENT",
        basePrice: 60,
        isActive: true,
    },
    {
        nameEn: "Dental Prophylaxis (Tartar Ultrasonic Clean, Ultrasonic Brush, Fresh Breath)",
        nameEs: "Profilaxis Dental (Limpieza Ultrasónica de Sarro, Cepillo Ultrasónico, Aliento Fresco)",
        category: "ADDON_TREATMENT",
        basePrice: 200,
        isActive: true,
    },
    {
        nameEn: "Dental Teeth Brushing",
        nameEs: "Cepillado de Dientes Dental",
        category: "ADDON_TREATMENT",
        basePrice: 35,
        isActive: true,
    },
    {
        nameEn: "Dental Professional Cream (White & Protection)",
        nameEs: "Crema Dental Profesional (Blanqueado y Protección)",
        category: "ADDON_TREATMENT",
        basePrice: 20,
        isActive: true,
    },

    // --- CATEGORY: EXTRAS & ADD-ONS (ADDON_TREATMENT & SPECIAL_SHAMPOO) ---
    {
        nameEn: "Anal Glands Expression",
        nameEs: "Drenado de Glándulas Anales",
        category: "ADDON_TREATMENT",
        basePrice: 40,
        isActive: true,
    },
    {
        nameEn: "Dermatitis Powder",
        nameEs: "Polvo para Dermatitis",
        category: "ADDON_TREATMENT",
        basePrice: 20,
        isActive: true,
    },
    {
        nameEn: "Whitening Shampoo Treatment",
        nameEs: "Tratamiento de Champú Blanqueador",
        category: "SPECIAL_SHAMPOO",
        basePrice: 35,
        isActive: true,
    },
    {
        nameEn: "Special Medicated Shampoo (for Irritated Skin)",
        nameEs: "Champú Medicado Especial (para Piel Irritada)",
        category: "SPECIAL_SHAMPOO",
        basePrice: 40,
        isActive: true,
    },
    {
        nameEn: "Special Shampoo for the Breed",
        nameEs: "Champú Especial según la Raza",
        category: "SPECIAL_SHAMPOO",
        basePrice: 20,
        isActive: true,
    },
    {
        nameEn: "Flea and Tick Treatment",
        nameEs: "Tratamiento Antipulgas y Garrapatas",
        category: "ADDON_TREATMENT",
        basePrice: 45,
        isActive: true,
    },
    {
        nameEn: "Deshedding",
        nameEs: "Tratamiento de Deslanado (Deshedding)",
        category: "ADDON_TREATMENT",
        basePrice: 60,
        isActive: true,
    },
    {
        nameEn: "Dematting",
        nameEs: "Tratamiento Desenredante (Dematting)",
        category: "ADDON_TREATMENT",
        basePrice: 60,
        isActive: true,
    },
    {
        nameEn: "Paw Moisturizer",
        nameEs: "Humectante de Almohadillas",
        category: "ADDON_TREATMENT",
        basePrice: 10,
        isActive: true,
    },
    {
        nameEn: "Hair Dye",
        nameEs: "Tinte de Pelo",
        category: "ADDON_TREATMENT",
        basePrice: 35,
        isActive: true,
    },
    {
        nameEn: "Nail Grinding",
        nameEs: "Limado de Uñas",
        category: "ADDON_TREATMENT",
        basePrice: 25,
        isActive: true,
    },
    {
        nameEn: "Nail Trimming",
        nameEs: "Corte de Uñas",
        category: "ADDON_TREATMENT",
        basePrice: 25,
        isActive: true,
    },
    {
        nameEn: "Nail Painting (All Colors)",
        nameEs: "Pintado de Uñas (Todos los Colores)",
        category: "ADDON_TREATMENT",
        basePrice: 20,
        isActive: true,
    },
    {
        nameEn: "Ear Cleaning",
        nameEs: "Limpieza de Oídos",
        category: "ADDON_TREATMENT",
        basePrice: 20,
        isActive: true,
    },

    // --- CATEGORY: SPA & AROMATHERAPY (ADDON_TREATMENT) ---
    {
        nameEn: "Full 1 hr Relaxing and Calming Session (Aromatherapy, Relaxing Music, Stress Free)",
        nameEs: "Sesión Completa de Relajación de 1 Hora (Aromaterapia, Música Relajante, Libre de Estrés)",
        category: "ADDON_TREATMENT",
        basePrice: 120,
        isActive: true,
    },
    {
        nameEn: "Relaxing Massage (with Aromatherapy)",
        nameEs: "Masaje Relajante (con Aromaterapia)",
        category: "ADDON_TREATMENT",
        basePrice: 36,
        isActive: true,
    },

    // --- CATEGORY: FEES & POLICIES (ADDON_TREATMENT) ---
    {
        nameEn: "Aggressive Behavior Fee",
        nameEs: "Cargo por Comportamiento Agresivo",
        category: "ADDON_TREATMENT",
        basePrice: 45,
        isActive: true,
    },
    {
        nameEn: "Cancellation Fee",
        nameEs: "Cargo por Cancelación Tardía",
        category: "ADDON_TREATMENT",
        basePrice: 35,
        isActive: true,
    },
    {
        nameEn: "Parking Fee",
        nameEs: "Cargo de Estacionamiento",
        category: "ADDON_TREATMENT",
        basePrice: 0,
        isActive: true,
    }
];

async function main() {
    console.log("Cleaning old service items from database...");
    const deleteResult = await prisma.serviceItem.deleteMany({});
    console.log(`Successfully deleted ${deleteResult.count} old service items.`);

    console.log("Inserting new structured catalog of service items...");
    const createResult = await prisma.serviceItem.createMany({
        data: services,
    });
    console.log(`Successfully inserted ${createResult.count} new service items.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("Database seeding completed successfully.");
    })
    .catch(async (e) => {
        console.error("Error occurred while seeding services:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
