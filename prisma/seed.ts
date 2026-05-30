import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('Mega1321@', 12)

    const user = await prisma.user.upsert({
        where: { email: 'groomersincpetspa@gmail.com' },
        update: {
            password
        },
        create: {
            email: 'groomersincpetspa@gmail.com',
            password
        },
    })

    await prisma.user.upsert({
        where: { email: 'royalabsolute0@gmail.com' },
        update: {
            password
        },
        create: {
            email: 'royalabsolute0@gmail.com',
            password,
            name: 'Pablo'
        },
    })

    // Seed Initial Site Config
    await prisma.siteConfig.upsert({
        where: { id: 'config' },
        update: {},
        create: {
            id: 'config',
            phone: '+1 (305) 555-0123',
            email: 'hello@groomingpet.com',
            address: '123 Miami Ave, Miami, FL 33101',
            heroTitleEs: 'Cuidado de',
            heroTitleEn: 'First Class Care',
            heroHighlightEs: 'Primera Clase',
            heroHighlightEn: 'for your Pets',
            heroDescEs: 'Especialistas en grooming profesional en Miami.',
            heroDescEn: 'Professional grooming specialists in Miami.',
            footerDescEs: 'Servicio premium de estética canina en el corazón de Miami.',
            footerDescEn: 'Premium canine aesthetics service in the heart of Miami.',
            instagramUrl: 'https://instagram.com/groomingpet',
            tiktokUrl: 'https://tiktok.com/@groomingpet'
        }
    })

    // Seed Gallery (Using public Unsplash IDs from the logs that 404'd to fix them or valid ones)
    // The previous 404s were likely due to malformed URLs or network issues, but let's use known valid ones.
    await prisma.galleryItem.createMany({
        data: [
            {
                url: '/assets/hero_dog_grooming_1774206829538.png',
                type: 'IMAGE',
                category: 'GROOMING'
            },
            {
                url: '/assets/cut_style_service_1774206878076.png',
                type: 'IMAGE',
                category: 'Grooming'
            },
            {
                url: '/assets/full_bath_service_1774206844856.png',
                type: 'IMAGE',
                category: 'Facilities'
            }
        ]
    })

    // Seed ServiceItems (New ununified dynamic pricing schema)
    await (prisma as any).serviceItem.createMany({
        data: [
            // MAIN_GROOMING
            {
                nameEs: 'Corte y Baño Completo',
                nameEn: 'Full Grooming & Bath',
                category: 'MAIN_GROOMING',
                basePrice: 75.00,
                isActive: true
            },
            {
                nameEs: 'Solo Baño Completo',
                nameEn: 'Full Bath Only',
                category: 'MAIN_GROOMING',
                basePrice: 45.00,
                isActive: true
            },
            {
                nameEs: 'Spa Deluxe',
                nameEn: 'Express Spa Deluxe',
                category: 'MAIN_GROOMING',
                basePrice: 95.00,
                isActive: true
            },
            // ADDON_TREATMENT
            {
                nameEs: 'Cepillado de Dientes',
                nameEn: 'Teeth Brushing',
                category: 'ADDON_TREATMENT',
                basePrice: 15.00,
                isActive: true
            },
            {
                nameEs: 'Corte y Limado de Uñas',
                nameEn: 'Nail Trim & Grind',
                category: 'ADDON_TREATMENT',
                basePrice: 12.00,
                isActive: true
            },
            {
                nameEs: 'Limpieza de Oídos Especial',
                nameEn: 'Special Ear Cleaning',
                category: 'ADDON_TREATMENT',
                basePrice: 10.00,
                isActive: true
            },
            {
                nameEs: 'Desenredado Anti-Nudos',
                nameEn: 'Dematting Treatment',
                category: 'ADDON_TREATMENT',
                basePrice: 20.00,
                isActive: true
            },
            {
                nameEs: 'Hidratación de Almohadillas',
                nameEn: 'Paw Balm Hydration',
                category: 'ADDON_TREATMENT',
                basePrice: 8.00,
                isActive: true
            },
            // SPECIAL_SHAMPOO
            {
                nameEs: 'Champú Hipoalergénico',
                nameEn: 'Hypoallergenic Shampoo',
                category: 'SPECIAL_SHAMPOO',
                basePrice: 5.00,
                isActive: true
            },
            {
                nameEs: 'Champú Medicado de Avena',
                nameEn: 'Oatmeal Medicated Shampoo',
                category: 'SPECIAL_SHAMPOO',
                basePrice: 10.00,
                isActive: true
            },
            {
                nameEs: 'Champú Desodorizante',
                nameEn: 'Deodorizing Shampoo',
                category: 'SPECIAL_SHAMPOO',
                basePrice: 7.00,
                isActive: true
            }
        ]
    })

    console.log({ user, message: "Database seeded successfully" })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
