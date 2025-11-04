"use client";

import { useState } from "react";
import CuotasAfiliado from "./CuotasAfiliado";
import QRScanner from "./QRScanner";
import { useRouter } from "next/navigation";

export default function AfiliadoPage() {
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [verFuturas, setVerFuturas] = useState(false);
  const router = useRouter();

  const handleScan = (data: string) => {
    setMostrarScanner(false);
    // Redirigir a la página de confirmación con los datos del QR
    router.push(`/afiliado/confirmar-compra?data=${encodeURIComponent(data)}`);
  };

  return (
    <div className="pb-24">

      <CuotasAfiliado verFuturas={verFuturas} />
      
      {mostrarScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setMostrarScanner(false)}
        />
      )}

      {/* Menú inferior fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Botón Historial (Cuotas Pasadas) - Izquierda */}
            <button
              onClick={() => setVerFuturas(false)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                !verFuturas
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">Historial</span>
            </button>

            {/* Botón QR Scanner - Centro (Redondo y Grande) */}
            <button
              onClick={() => setMostrarScanner(true)}
              className="relative -mt-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-5 shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>

            {/* Botón Cuotas a Pagar (Cuotas Futuras) - Derecha */}
            <button
              onClick={() => setVerFuturas(true)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
                verFuturas
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-xs font-semibold">A Pagar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
