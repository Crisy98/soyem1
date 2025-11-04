"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

interface FormularioVentaProps {
  idComercio: number;
  nombreComercio: string;
}

export default function FormularioVenta({ idComercio, nombreComercio }: FormularioVentaProps) {
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("1");
  const [mostrarQR, setMostrarQR] = useState(false);
  const [datosQR, setDatosQR] = useState("");

  const generarQR = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    const montoParsed = parseFloat(monto);
    const cuotasParsed = parseInt(cuotas);

    // Crear objeto con datos de la venta
    const datosVenta = {
      idComercio,
      nombreComercio,
      monto: montoParsed,
      cuotas: cuotasParsed,
      timestamp: Date.now(),
    };

    // Convertir a JSON y codificar en base64
    const datosString = JSON.stringify(datosVenta);
    const datosBase64 = btoa(datosString);

    setDatosQR(datosBase64);
    setMostrarQR(true);
  };

  const cerrarQR = () => {
    setMostrarQR(false);
    setMonto("");
    setCuotas("1");
  };

  const montoPorCuota = monto && cuotas ? (parseFloat(monto) / parseInt(cuotas)).toFixed(2) : "0.00";

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💳 Nueva Venta</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Monto Total
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-slate-900 font-medium placeholder:text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cantidad de Cuotas
          </label>
          <select
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-slate-900 font-medium"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "cuota" : "cuotas"}
              </option>
            ))}
          </select>
        </div>

        {monto && parseFloat(monto) > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">El afiliado pagará:</p>
            <p className="text-2xl font-bold text-blue-600">
              ${montoPorCuota} <span className="text-base font-normal text-gray-600">por mes</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              durante {cuotas} {parseInt(cuotas) === 1 ? "mes" : "meses"}
            </p>
          </div>
        )}

        <button
          onClick={generarQR}
          disabled={!monto || parseFloat(monto) <= 0}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-lg shadow-lg transition text-lg"
        >
          🔲 Generar Código QR
        </button>
      </div>

      {/* Modal QR */}
      {mostrarQR && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Código QR de Venta</h3>
              <button
                onClick={cerrarQR}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCode
                value={datosQR}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="H"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Detalles de la venta:</p>
              <p className="text-lg font-bold text-gray-800">${monto}</p>
              <p className="text-sm text-gray-600">
                {cuotas} {parseInt(cuotas) === 1 ? "cuota" : "cuotas"} de ${montoPorCuota}
              </p>
            </div>

            <p className="text-center text-sm text-gray-600 mb-4">
              El afiliado debe escanear este código para confirmar la compra
            </p>

            <button
              onClick={cerrarQR}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
