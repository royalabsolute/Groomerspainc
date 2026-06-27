import AppSidebar from "@/components/AppSidebar";
import SecondaryPanel from "@/components/SecondaryPanel";
import { NavigationProvider } from "@/context/NavigationContext";
import MusicPlayer from "@/components/MusicPlayer";
import SessionProviderWrapper from "@/components/admin/SessionProviderWrapper";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  // Redirigir si no está autenticado
  if (!session || !session.user) {
    redirect(`/${locale}/login-admin?callbackUrl=/${locale}/admin`);
  }

  return (
    <SessionProviderWrapper>
      <NavigationProvider>
        <div className="flex h-screen w-full select-none overflow-hidden bg-[#1E1F22] font-sans antialiased text-[#DBDEE1]">
          {/* Barra lateral izquierda de Absolute Nexus (72px) */}
          <AppSidebar />

          {/* Barra de canales secundaria (240px) */}
          <SecondaryPanel />

          {/* Área principal del panel administrativo */}
          <div className="flex-1 bg-[#313338] flex flex-col min-w-0 overflow-hidden relative">
            {/* Header unificado estilo Discord */}
            <header className="h-12 border-b border-[#1F2023] flex items-center justify-between px-6 shrink-0 bg-[#313338] shadow-[0_1px_2px_rgba(0,0,0,0.24)] z-10">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">Absolute ERP Panel</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400 font-light">
                  Sesión activa: <strong className="text-zinc-200 font-semibold">{session.user.name || session.user.email}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 capitalize text-[10px]">
                  {session.user.role || "ADMIN_GENERAL"}
                </span>
              </div>
            </header>

            {/* Contenido de la página */}
            <main className="flex-1 overflow-y-auto min-w-0">
              {children}
            </main>
          </div>
        </div>

        {/* Reproductor de música global */}
        <MusicPlayer />
      </NavigationProvider>
    </SessionProviderWrapper>
  );
}
