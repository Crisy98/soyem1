"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

interface Cuota {
  idcuota: number;
  idmovimiento: number;
  numerocuota: number;
  fechavencimiento: string;
  importecuota: number;
  afiliado_nombre: string;
  fechacompra: string;
  total_cuotas: number;
}

interface CuotasPorMes {
  [key: string]: {
    cuotas: Cuota[];
    total: number;
    mes: number;
    anio: number;
  };
}

interface CuotasComercioProps {
  idComercio: number;
  nombreComercio: string;
  verPorCobrar: boolean;
  mostrarGenerarQR: boolean;
  onCerrarQR: () => void;
}

export default function CuotasComercio({ idComercio, nombreComercio, verPorCobrar, mostrarGenerarQR, onCerrarQR }: CuotasComercioProps) {
  const [cuotasCobradas, setCuotasCobradas] = useState<CuotasPorMes>({});
  const [cuotasPorCobrar, setCuotasPorCobrar] = useState<CuotasPorMes>({});
  const [loading, setLoading] = useState(true);
  const [mostrarTodosMeses, setMostrarTodosMeses] = useState(false);
  const [mesesExpandidos, setMesesExpandidos] = useState<{ [key: string]: boolean }>({});
  
  // Estados para nueva venta
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [monto, setMonto] = useState("");
  const [cuotas, setCuotas] = useState("1");
  const [mostrarQR, setMostrarQR] = useState(false);
  const [datosQR, setDatosQR] = useState("");
  
  // Estados para notificación
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [datosNotificacion, setDatosNotificacion] = useState<any>(null);
  const [timestampUltimoCheck, setTimestampUltimoCheck] = useState(Date.now());

  useEffect(() => {
    if (idComercio) {
      fetchCuotas();
    } else {
      // Si no hay idComercio, marcar como no loading para mostrar mensaje
      setLoading(false);
    }
  }, [idComercio]);

  // Sincronizar con la prop externa
  useEffect(() => {
    setMostrarFormulario(mostrarGenerarQR);
  }, [mostrarGenerarQR]);

  // Polling para verificar nuevas ventas cuando el QR está abierto
  useEffect(() => {
    if (!mostrarQR) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/comercio/verificar-ventas?desde=${timestampUltimoCheck}`, { credentials: 'include' });
        const data = await res.json();

        if (data.nuevaVenta) {
          // Mostrar notificación
          setDatosNotificacion(data.datos);
          setMostrarNotificacion(true);
          
          // Cerrar QR
          setMostrarQR(false);
          setMostrarFormulario(false);
          onCerrarQR();
          
          // Recargar cuotas
          fetchCuotas();
          
          // Actualizar timestamp
          setTimestampUltimoCheck(Date.now());
          
          // Auto-cerrar notificación después de 5 segundos
          setTimeout(() => {
            setMostrarNotificacion(false);
          }, 5000);
        }
      } catch (error) {
        console.error('Error verificando ventas:', error);
      }
    }, 2000); // Verificar cada 2 segundos

    return () => clearInterval(interval);
  }, [mostrarQR, timestampUltimoCheck]);

  const fetchCuotas = async () => {
    try {
      const res = await fetch("/api/comercio/cuotas", { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        procesarCuotas(data.cuotas);
      }
    } catch (error) {
      console.error("Error cargando cuotas:", error);
    } finally {
      setLoading(false);
    }
  };

  const procesarCuotas = (cuotas: Cuota[]) => {
    const cuotasNormalizadas = cuotas.map((cuota) => {
      const importeCuota = Number((cuota as unknown as { importecuota: unknown }).importecuota ?? 0);
      const totalCuotas = Number((cuota as unknown as { total_cuotas: unknown }).total_cuotas ?? cuota.total_cuotas ?? 0);
      const numeroCuota = Number((cuota as unknown as { numerocuota: unknown }).numerocuota ?? cuota.numerocuota ?? 0);

      return {
        ...cuota,
        importecuota: importeCuota,
        total_cuotas: totalCuotas,
        numerocuota: numeroCuota,
      };
    });

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    
    const cobradas: CuotasPorMes = {};
    const porCobrar: CuotasPorMes = {};

    cuotasNormalizadas.forEach((cuota) => {
      const fechaVenc = new Date(cuota.fechavencimiento);
      const mesVenc = fechaVenc.getMonth() + 1;
      const anioVenc = fechaVenc.getFullYear();

      if (anioVenc < anioActual || (anioVenc === anioActual && mesVenc <= mesActual)) {
        // Cuota cobrada o del mes actual
        const keyMes = `${anioVenc}-${mesVenc}`;
        
        if (!cobradas[keyMes]) {
          cobradas[keyMes] = {
            cuotas: [],
            total: 0,
            mes: mesVenc,
            anio: anioVenc,
          };
        }
        
        cobradas[keyMes].cuotas.push(cuota);
        cobradas[keyMes].total += cuota.importecuota;
      } else {
        // Cuota por cobrar
        const keyMes = `${anioVenc}-${mesVenc}`;
        
        if (!porCobrar[keyMes]) {
          porCobrar[keyMes] = {
            cuotas: [],
            total: 0,
            mes: mesVenc,
            anio: anioVenc,
          };
        }
        
        porCobrar[keyMes].cuotas.push(cuota);
        porCobrar[keyMes].total += cuota.importecuota;
      }
    });

    setCuotasCobradas(cobradas);
    setCuotasPorCobrar(porCobrar);
  };

  const getNombreMes = (mes: number) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[mes - 1];
  };

  const toggleMesExpandido = (key: string) => {
    setMesesExpandidos((prev: { [key: string]: boolean }) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const generarQR = () => {
    if (!monto || parseFloat(monto) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    const montoParsed = parseFloat(monto);
    const cuotasParsed = parseInt(cuotas);

    const datosVenta = {
      idComercio,
      nombreComercio,
      monto: montoParsed,
      cuotas: cuotasParsed,
      timestamp: Date.now(),
    };

    const datosString = JSON.stringify(datosVenta);
    const datosBase64 = btoa(datosString);

    setDatosQR(datosBase64);
    setMostrarQR(true);
  };

  const cerrarQR = () => {
    setMostrarQR(false);
    setMostrarFormulario(false);
    setMonto("");
    setCuotas("1");
    onCerrarQR();
    // Recargar cuotas
    fetchCuotas();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay idComercio, mostrar mensaje
  if (!idComercio) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-gray-500 text-lg mb-2">No se pudo cargar la información del comercio</p>
        <p className="text-gray-400 text-sm">Por favor, intenta recargar la página</p>
      </div>
    );
  }

  const mesesCobradasOrdenados = Object.entries(cuotasCobradas).sort((a, b) => {
    const [anioA, mesA] = a[0].split('-').map(Number);
    const [anioB, mesB] = b[0].split('-').map(Number);
    if (anioB !== anioA) return anioB - anioA;
    return mesB - mesA;
  });

  const mesesPorCobrarOrdenados = Object.entries(cuotasPorCobrar).sort((a, b) => {
    const [anioA, mesA] = a[0].split('-').map(Number);
    const [anioB, mesB] = b[0].split('-').map(Number);
    if (anioA !== anioB) return anioA - anioB;
    return mesA - mesB;
  });

  const mesesAMostrar = verPorCobrar 
    ? mesesPorCobrarOrdenados 
    : (mostrarTodosMeses ? mesesCobradasOrdenados : mesesCobradasOrdenados.slice(0, 3));

  const montoPorCuota = monto && cuotas ? (parseFloat(monto) / parseInt(cuotas)).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Vista de Cobrado */}
      {!verPorCobrar && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            💰 Ingresos Cobrados
          </h3>
          
          {mesesCobradasOrdenados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg font-semibold mb-2">No hay cuotas cobradas</p>
              <p className="text-gray-500 text-sm">
                Cuando realices ventas con cuotas, aparecerán aquí una vez cobradas
              </p>
            </div>
          ) : (
            <>
              {mesesAMostrar.map(([key, datos]) => (
                <div
                  key={key}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-bold">
                          {getNombreMes(datos.mes)} {datos.anio}
                        </h4>
                        <p className="text-sm opacity-90 mt-1">
                          {datos.cuotas.length} cuota{datos.cuotas.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">Total cobrado</p>
                        <p className="text-2xl font-bold">${datos.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {(mesesExpandidos[key] ? datos.cuotas : datos.cuotas.slice(0, 3)).map((cuota) => (
                      <div
                        key={cuota.idcuota}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {cuota.afiliado_nombre}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Cuota {cuota.numerocuota} de {cuota.total_cuotas}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Venta: {new Date(cuota.fechacompra).toLocaleDateString("es-AR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ${cuota.importecuota.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {datos.cuotas.length > 3 && (
                      <div className="p-3 bg-gray-50">
                        <button
                          onClick={() => toggleMesExpandido(key)}
                          className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-2 hover:bg-gray-100 rounded transition"
                        >
                          {mesesExpandidos[key] 
                            ? `▲ Mostrar menos` 
                            : `▼ Ver ${datos.cuotas.length - 3} cuotas más`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!verPorCobrar && mesesCobradasOrdenados.length > 3 && !mostrarTodosMeses && (
                <button
                  onClick={() => setMostrarTodosMeses(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
                >
                  Ver {mesesCobradasOrdenados.length - 3} meses más antiguos ↓
                </button>
              )}

              {mostrarTodosMeses && (
                <button
                  onClick={() => setMostrarTodosMeses(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
                >
                  Mostrar menos ↑
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Vista de Por Cobrar */}
      {verPorCobrar && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            📅 Ingresos Por Cobrar
          </h3>
          
          {mesesPorCobrarOrdenados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 text-lg font-semibold mb-2">No hay cuotas por cobrar</p>
              <p className="text-gray-500 text-sm">
                Las ventas a futuro aparecerán aquí
              </p>
            </div>
          ) : (
            mesesPorCobrarOrdenados.map(([key, datos]) => (
              <div
                key={key}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-bold">
                        {getNombreMes(datos.mes)} {datos.anio}
                      </h4>
                      <p className="text-sm opacity-90 mt-1">
                        {datos.cuotas.length} cuota{datos.cuotas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-80">A cobrar</p>
                      <p className="text-2xl font-bold">${datos.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {(mesesExpandidos[key] ? datos.cuotas : datos.cuotas.slice(0, 3)).map((cuota) => (
                    <div
                      key={cuota.idcuota}
                      className="p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {cuota.afiliado_nombre}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Cuota {cuota.numerocuota} de {cuota.total_cuotas}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Venta: {new Date(cuota.fechacompra).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            ${cuota.importecuota.toFixed(2)}
                          </p>
                          <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Pendiente
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {datos.cuotas.length > 3 && (
                    <div className="p-3 bg-gray-50">
                      <button
                        onClick={() => toggleMesExpandido(key)}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-gray-100 rounded transition"
                      >
                        {mesesExpandidos[key] 
                          ? `▲ Mostrar menos` 
                          : `▼ Ver ${datos.cuotas.length - 3} cuotas más`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Formulario Nueva Venta */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">💳 Nueva Venta</h3>
              <button
                onClick={() => {
                  setMostrarFormulario(false);
                  onCerrarQR();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
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
          </div>
        </div>
      )}

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
            
            <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
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

      {/* Notificación de compra aprobada */}
      {mostrarNotificacion && datosNotificacion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Compra Aprobada!</h2>
            <p className="text-gray-700 mb-4">
              El afiliado <span className="font-bold">{datosNotificacion.nombre_afiliado}</span> ha confirmado la compra
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-3xl font-bold text-green-700">${datosNotificacion.monto}</p>
              <p className="text-sm text-gray-600">
                {datosNotificacion.cuotas} {datosNotificacion.cuotas === 1 ? "cuota" : "cuotas"}
              </p>
            </div>
            <button
              onClick={() => setMostrarNotificacion(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
