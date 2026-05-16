import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('admin123', 12)

    const user = await prisma.user.upsert({
        where: { email: 'admin@groomingpet.com' },
        update: {},
        create: {
            email: 'admin@groomingpet.com',
            password,
            role: 'MODIFIER'
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
            facebookUrl: 'https://facebook.com/groomingpet'
        }
    })

    // Seed Services
    await prisma.service.createMany({
        data: [
            {
                titleEs: 'Baño Completo',
                titleEn: 'Full Bath',
                descEs: 'Incluye baño con shampoo premium, corte de uñas y limpieza de oídos.',
                descEn: 'Includes premium shampoo bath, nail trimming and ear cleaning.',
                price: 45.00,
                imageUrl: '/assets/full_bath_service_1774206844856.png',
                order: 1
            },
            {
                titleEs: 'Corte y Estilo',
                titleEn: 'Cut & Style',
                descEs: 'Corte de raza o personalizado, baño completo y perfume.',
                descEn: 'Breed specific or custom cut, full bath and perfume.',
                price: 65.00,
                imageUrl: '/assets/cut_style_service_1774206878076.png',
                order: 2
            },
            {
                titleEs: 'Limpieza Dental',
                titleEn: 'Teeth Cleaning',
                descEs: 'Limpieza profunda sin anestesia para una sonrisa brillante.',
                descEn: 'Deep cleaning without anesthesia for a bright smile.',
                price: 30.00,
                imageUrl: '/assets/teeth_cleaning_service_1774206986270.png',
                order: 3
            }
        ]
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
