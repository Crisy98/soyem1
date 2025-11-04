"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CuotasComercio from "./CuotasComercio";

export default function ComercioPage() {
  const [idComercio, setIdComercio] = useState<number>(0);
  const [nombreComercio, setNombreComercio] = useState<string>("");
  const [verPorCobrar, setVerPorCobrar] = useState(false);
  const [mostrarGenerarQR, setMostrarGenerarQR] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener datos del comercio desde el token/session
    fetchDatosComercio();
  }, []);

  const fetchDatosComercio = async () => {
    try {
      const res = await fetch("/api/comercio/datos");
      const data = await res.json();
      
      if (res.ok) {
        setIdComercio(data.idComercio);
        setNombreComercio(data.nombreComercio);
        setLoading(false);
      } else {
        console.error("Error obteniendo datos del comercio:", data.error);
        
        // Si no es un comercio, redirigir
        if (data.error === "acceso_denegado" || data.error === "no_comercio") {
          setError("No tienes acceso a esta sección. Solo para comercios adheridos.");
          setTimeout(() => {
            router.push("/afiliado");
          }, 2000);
        } else {
          setError(data.message || "Error al cargar los datos");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos del comercio:", error);
      setError("Error de conexión. Intenta recargar la página.");
      setLoading(false);
    }
  };

  // Si hay error de acceso, mostrar mensaje y redirigir
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Redirigiendo...
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Ventas</h2>
      </div>
      
      <CuotasComercio 
        idComercio={idComercio} 
        nombreComercio={nombreComercio}
        verPorCobrar={verPorCobrar}
        mostrarGenerarQR={mostrarGenerarQR}
        onCerrarQR={() => setMostrarGenerarQR(false)}
      />

      {/* Menú inferior fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Botón Por Cobrar - Izquierda */}
            <button
              onClick={() => setVerPorCobrar(true)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                verPorCobrar
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">Por Cobrar</span>
            </button>

            {/* Botón Generar QR - Centro (Redondo y Grande) */}
            <button
              onClick={() => setMostrarGenerarQR(true)}
              className="relative -mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full p-5 shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>

            {/* Botón Cobrado - Derecha */}
            <button
              onClick={() => setVerPorCobrar(false)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                !verPorCobrar
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">Cobrado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
