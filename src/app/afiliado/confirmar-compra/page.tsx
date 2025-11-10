"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmarCompraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [datosCompra, setDatosCompra] = useState<any>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarExito, setMostrarExito] = useState(false);
  const [saldoDisponible, setSaldoDisponible] = useState<number | null>(null);
  const [cargandoSaldo, setCargandoSaldo] = useState(true);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        // Decodificar datos del QR
        const datosString = atob(data);
        const datos = JSON.parse(datosString);
        setDatosCompra(datos);
        
        // Verificar saldo disponible
        verificarSaldo();
      } catch (err) {
        setError("Código QR inválido");
      }
    } else {
      setError("No se recibieron datos de la compra");
    }
  }, [searchParams]);

  const verificarSaldo = async () => {
    try {
  const res = await fetch("/api/afiliado/saldo-disponible", { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setSaldoDisponible(data.saldoDisponible);
      } else {
        setError(data.error || "No se pudo verificar el saldo disponible");
      }
    } catch (err) {
      setError("Error al verificar saldo disponible");
    } finally {
      setCargandoSaldo(false);
    }
  };

  const confirmarCompra = async () => {
    if (!datosCompra) return;

    // Validar saldo suficiente por CUOTA (no por total)
    const montoPorCuotaNumber = Number((datosCompra.monto / datosCompra.cuotas).toFixed(2));
    if (saldoDisponible !== null && montoPorCuotaNumber > saldoDisponible) {
      setError(`Saldo insuficiente. Disponible: $${saldoDisponible.toFixed(2)}`);
      return;
    }

    setProcesando(true);
    try {
      const res = await fetch("/api/afiliado/procesar-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCompra),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        // Mostrar mensaje de éxito
        setMostrarExito(true);
        
        // Esperar 3 segundos y redirigir
        setTimeout(() => {
          router.push("/afiliado");
        }, 3000);
      } else {
        setError(data.error || "Error al procesar la compra");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setProcesando(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-2xl mb-4">❌</p>
          <p className="text-red-800 font-semibold">{error}</p>
          <button
            onClick={() => router.push("/afiliado")}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!datosCompra) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const montoPorCuota = (datosCompra.monto / datosCompra.cuotas).toFixed(2);
  const montoPorCuotaNumber = Number(montoPorCuota);
  const saldoSuficiente = saldoDisponible !== null && montoPorCuotaNumber <= saldoDisponible;

  // Modal de éxito
  if (mostrarExito) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">¡Compra Finalizada!</h2>
          <p className="text-gray-700 mb-4">
            Tu compra ha sido procesada exitosamente
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-2xl font-bold text-green-700">${datosCompra.monto.toFixed(2)}</p>
            <p className="text-sm text-gray-600">
              {datosCompra.cuotas} {datosCompra.cuotas === 1 ? "cuota" : "cuotas"} de ${montoPorCuota}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Redirigiendo al menú principal...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Confirmar Compra</h2>
          <p className="text-blue-100">Revisa los detalles antes de confirmar</p>
        </div>

        {/* Detalles */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Comercio</p>
            <p className="text-xl font-bold text-gray-800">{datosCompra.nombreComercio}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">${datosCompra.monto.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Cuotas</p>
              <p className="text-2xl font-bold text-blue-600">{datosCompra.cuotas}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Pagarás por mes:</p>
            <p className="text-3xl font-bold text-orange-600">${montoPorCuota}</p>
            <p className="text-xs text-gray-500 mt-2">
              durante {datosCompra.cuotas} {datosCompra.cuotas === 1 ? "mes" : "meses"}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800 mb-2">📅 Calendario de pagos:</p>
            <div className="space-y-1">
              {Array.from({ length: Math.min(datosCompra.cuotas, 3) }, (_, i) => {
                const fecha = new Date();
                const diaActual = fecha.getDate();
                const mesesADesfasar = diaActual >= 20 ? 1 : 0;
                fecha.setMonth(fecha.getMonth() + mesesADesfasar + i);
                return (
                  <div key={i} className="text-xs text-gray-700">
                    • Cuota {i + 1}: {fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" })} - ${montoPorCuota}
                  </div>
                );
              })}
              {datosCompra.cuotas > 3 && (
                <div className="text-xs text-gray-500">
                  ... y {datosCompra.cuotas - 3} cuotas más
                </div>
              )}
            </div>
          </div>

          {/* Saldo disponible */}
          {cargandoSaldo ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Verificando saldo disponible...</p>
            </div>
          ) : saldoDisponible !== null && (
            <div className={`rounded-lg p-4 border-2 ${
              saldoSuficiente 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Saldo Disponible</p>
                  <p className={`text-2xl font-bold ${
                    saldoSuficiente ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${saldoDisponible.toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl">
                  {saldoSuficiente ? '✓' : '⚠️'}
                </div>
              </div>
              {!saldoSuficiente && (
                <div className="mt-3 bg-red-100 rounded p-2">
                  <p className="text-xs text-red-800 font-semibold">
                    ⚠️ Saldo insuficiente para esta compra
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Te faltan: ${(montoPorCuotaNumber - (saldoDisponible ?? 0)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="p-6 bg-gray-50 space-y-3">
          <button
            onClick={confirmarCompra}
            disabled={procesando || cargandoSaldo || !saldoSuficiente}
            className={`w-full font-bold py-4 rounded-lg shadow-lg transition text-lg ${
              !saldoSuficiente && !cargandoSaldo
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
            }`}
          >
            {procesando ? "Procesando..." : 
             cargandoSaldo ? "Verificando saldo..." :
             !saldoSuficiente ? "❌ Saldo Insuficiente" :
             "✓ Confirmar Compra"}
          </button>
          <button
            onClick={() => router.push("/afiliado")}
            disabled={procesando}
            className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarCompraPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ConfirmarCompraContent />
    </Suspense>
  );
}
