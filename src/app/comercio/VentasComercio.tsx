"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Venta {
  idmovimiento: number;
  fechacompra: string;
  importe: number;
  cuotas: number;
  afiliado_nombre: string;
  afiliado_apellido: string;
}

interface VentasPorMes {
  [key: string]: {
    ventas: Venta[];
    total: number;
  };
}

export default function VentasComercio() {
  const [ventasPorMes, setVentasPorMes] = useState<VentasPorMes>({});
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [comercioId, setComercioId] = useState<number | null>(null);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
  const res = await fetch("/api/comercio/ventas", { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setComercioId(data.idcomercio);
        agruparPorMes(data.ventas);
      }
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const agruparPorMes = (ventas: Venta[]) => {
    const agrupadas: VentasPorMes = {};

    ventas.forEach((venta) => {
      const fecha = new Date(venta.fechacompra);
      const mesAno = `${fecha.toLocaleString("es-AR", {
        month: "long",
      })} ${fecha.getFullYear()}`;

      const importe = Number((venta as unknown as { importe: unknown }).importe ?? 0);
      const cuotaCantidad = Number((venta as unknown as { cuotas: unknown }).cuotas ?? 0);
      const ventaNormalizada: Venta = {
        ...venta,
        importe,
        cuotas: cuotaCantidad,
      };

      if (!agrupadas[mesAno]) {
        agrupadas[mesAno] = { ventas: [], total: 0 };
      }

      agrupadas[mesAno].ventas.push(ventaNormalizada);
      agrupadas[mesAno].total += importe;
    });

    setVentasPorMes(agrupadas);
  };

  const generarQR = async () => {
    if (!comercioId) return;

    try {
      // Genera QR con el ID del comercio
      const qrData = `COMERCIO_${comercioId}`;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrImage(qrUrl);
      setShowQR(true);
    } catch (error) {
      console.error("Error generando QR:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Generar QR - Destacado en móvil */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <button
          onClick={generarQR}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center justify-center space-x-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <span>Generar Código QR</span>
        </button>
      </div>

      {/* Modal QR */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-center mb-4">
              Tu Código QR
            </h3>
            <div className="flex justify-center mb-4">
              <img src={qrImage} alt="QR Code" className="w-64 h-64" />
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Muestra este código a tus clientes para que puedan escanear y
              realizar compras
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Lista de ventas agrupadas por mes */}
      {Object.keys(ventasPorMes).length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500">No hay ventas registradas</p>
        </div>
      ) : (
        Object.entries(ventasPorMes).map(([mes, datos]) => (
          <div key={mes} className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Header del mes */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-4">
              <h3 className="text-lg font-bold capitalize">{mes}</h3>
              <p className="text-sm opacity-90">
                Total: ${datos.total.toFixed(2)} ({datos.ventas.length}{" "}
                {datos.ventas.length === 1 ? "venta" : "ventas"})
              </p>
            </div>

            {/* Lista de ventas del mes */}
            <div className="divide-y divide-gray-200">
              {datos.ventas.map((venta) => (
                <div
                  key={venta.idmovimiento}
                  className="p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {venta.afiliado_nombre} {venta.afiliado_apellido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(venta.fechacompra).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ${venta.importe.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {venta.cuotas} cuota{venta.cuotas > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
