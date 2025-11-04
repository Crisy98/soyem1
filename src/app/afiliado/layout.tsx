"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import CambiarContrasenaModal from "@/components/CambiarContrasenaModal";

export default function AfiliadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile-First */}
      <header className="bg-green-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="SOYEM Logo" 
                width={100} 
                height={34} 
                className="h-8 w-auto"
                priority 
              />
              <span className="text-sm font-medium">Afiliado</span>
            </div>
            
            {/* Botón de menú móvil */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Menú desktop */}
            <nav className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => setMostrarCambiarContrasena(true)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Cambiar Contraseña
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
              >
                Cerrar Sesión
              </button>
            </nav>
          </div>

          {/* Menú móvil desplegable */}
          {menuOpen && (
            <nav className="lg:hidden mt-4 pb-2 border-t border-green-500 pt-4 space-y-2">
              <button
                onClick={() => {
                  setMostrarCambiarContrasena(true);
                  setMenuOpen(false);
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Cambiar Contraseña
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
              >
                Cerrar Sesión
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <CambiarContrasenaModal
        isOpen={mostrarCambiarContrasena}
        onClose={() => setMostrarCambiarContrasena(false)}
      />
    </div>
  );
}
