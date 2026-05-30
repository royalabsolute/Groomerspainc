import db from "@/lib/db";
import AdminInquiriesClient, { type InquiryItem } from "@/components/admin/AdminInquiriesClient";

export const revalidate = 0;

export default async function AdminInquiriesPage() {
    const [rawQuotes, rawServices] = await Promise.all([
        (db as any).quoteRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                pets: {
                    include: {
                        services: true
                    }
                }
            }
        }),
        (db as any).serviceItem.findMany()
    ]);

    // Map relational database items to the expected client InquiryItem interface
    const inquiries: InquiryItem[] = rawQuotes.map((item: any) => {
        const pets = (item.pets || []).map((pet: any) => {
            const petServiceIds = (pet.services || []).map((s: any) => s.id).join(",");
            return {
                id: pet.id,
                name: pet.name,
                breed: pet.breed,
                weight: Number(pet.weightLbs),
                age: pet.ageYears !== null && pet.ageYears !== undefined ? `${pet.ageYears} ${pet.ageYears === 1 ? "año" : "años"}` : "N/A",
                rabiesVaccinated: pet.rabiesVaccineUpToDate,
                rabiesRegistry: pet.rabiesRegistry,
                selectedServiceIds: petServiceIds,
                petImageUrl: pet.photoUrl,
                shampooId: pet.shampooId
            };
        });

        const firstPet = pets[0] || {
            name: "N/A",
            breed: "N/A",
            weight: 0,
            age: "N/A",
            rabiesVaccinated: false,
            rabiesRegistry: null,
            selectedServiceIds: "",
            petImageUrl: null,
            shampooId: null
        };

        return {
            id: item.id,
            name: item.ownerName,
            email: item.ownerEmail,
            phone: item.ownerPhone,
            address: item.address,
            zipCode: item.zipCode,
            
            // Backward compatibility
            petName: pets.map((p: any) => p.name).join(", ") || "N/A",
            breed: pets.map((p: any) => p.breed).join(", ") || "N/A",
            petWeight: firstPet.weight,
            petAge: firstPet.age,
            rabiesVaccinated: pets.length > 0 ? pets.every((p: any) => p.rabiesVaccinated) : false,
            rabiesRegistry: firstPet.rabiesRegistry,
            selectedServiceIds: pets.map((p: any) => p.selectedServiceIds).filter(Boolean).join(","),
            petImageUrl: firstPet.petImageUrl,
            
            message: item.message,
            discountCode: item.discountCode,
            systemEstimatedPrice: Number(item.systemEstimatedPrice),
            finalAdminPrice: item.finalAdminPrice ? Number(item.finalAdminPrice) : null,
            status: item.status,
            read: item.read,
            createdAt: item.createdAt,
            pets: pets
        };
    });

    const services = rawServices.map((s: any) => ({
        id: s.id,
        nameEs: s.nameEs,
        nameEn: s.nameEn,
        category: s.category,
        basePrice: Number(s.basePrice),
        isActive: s.isActive
    }));

    return <AdminInquiriesClient initialItems={inquiries} services={services} />;
}
