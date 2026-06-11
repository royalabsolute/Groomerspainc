"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, introduce tu correo y contraseña.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("CredentialsSignin")) {
          setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
        } else {
          setError(result.error);
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Ha ocurrido un error inesperado al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#313338] px-4 font-sans select-none">
      
      {/* Tarjeta de Inicio de Sesión */}
      <div className="w-full max-w-[480px] bg-[#2B2D31] rounded-[5px] shadow-2xl p-8 flex flex-col gap-6">
        
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center gap-2">
          <img
            src="/RoyalAbsoluteTDSOTL.png"
            alt="Royal Absolute Logo"
            className="w-64 md:w-72 h-auto mx-auto mb-6 object-contain drop-shadow-lg"
          />
          <h1 className="text-2xl font-semibold text-[#F2F3F5] tracking-tight">
            ¡Te damos la bienvenida!
          </h1>
          <p className="text-sm text-[#B5BAC1]">
            Panel Corporativo
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="bg-[#F23F43]/10 border border-[#F23F43]/20 rounded-[4px] p-3 flex items-start gap-2.5 text-xs text-[#F23F43] leading-relaxed">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Input: Email */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#B5BAC1] tracking-wider uppercase">
              Correo Electrónico <span className="text-[#F23F43] font-normal">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@absolutenexus.com"
              className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm px-3 py-2.5 rounded-[3px] border border-transparent outline-none focus:border-[#5865F2] transition-colors duration-150 placeholder-[#4E5058]"
            />
          </div>

          {/* Input: Contraseña */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#B5BAC1] tracking-wider uppercase">
                Contraseña <span className="text-[#F23F43] font-normal">*</span>
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#1E1F22] text-[#F2F3F5] text-sm px-3 py-2.5 rounded-[3px] border border-transparent outline-none focus:border-[#5865F2] transition-colors duration-150 placeholder-[#4E5058]"
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] disabled:opacity-50 text-white font-medium text-sm py-3 rounded-[3px] transition-colors duration-150 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar sesión</span>
            )}
          </button>

        </form>

      </div>
      
    </div>
  );
}
