import { redirect } from "next/navigation";

export default async function LocalizedRootPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    
    // Redirige inmediatamente a la pantalla de login del administrador
    redirect(`/${locale}/login-admin`);
}
