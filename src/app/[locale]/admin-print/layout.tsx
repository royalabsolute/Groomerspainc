import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPrintLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const session = await auth();
    const { locale } = await (params as any);
    if (!session) {
        redirect(`/${locale}/login-admin`);
    }

    return <>{children}</>;
}
