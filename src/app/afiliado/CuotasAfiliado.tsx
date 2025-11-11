"use client";

import { useEffect, useState } from "react";

interface Cuota {
  idcuota: number;
  idmovimiento: number;
  numerocuota: number;
  fechavencimiento: string;
  importecuota: number; // se normaliza a número en procesamiento
  pagada: boolean;
  comercio_nombre: string;
  fechacompra: string;
  total_cuotas: number; // se normaliza a número en procesamiento
}

interface Tope {
  mes: number;
  anio: number;
  importe: number;
}

interface CuotasPorMes {
  [key: string]: {
    cuotas: Cuota[];
    total: number;
    mes: number;
    anio: number;
  };
}

interface CuotasAfiliadoProps {
  verFuturas: boolean;
}

export default function CuotasAfiliado({ verFuturas }: CuotasAfiliadoProps) {
  const [cuotasPasadasPorMes, setCuotasPasadasPorMes] = useState<CuotasPorMes>({});
  const [cuotasFuturas, setCuotasFuturas] = useState<Cuota[]>([]);
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [topeMesActual, setTopeMesActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mostrarTodosMeses, setMostrarTodosMeses] = useState(false);
  const [mesesExpandidos, setMesesExpandidos] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCuotas();
  }, []);

  const fetchCuotas = async () => {
    try {
  const res = await fetch("/api/afiliado/cuotas", { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        procesarCuotas(data.cuotas, data.topes);
      }
    } catch (error) {
      console.error("Error cargando cuotas:", error);
    } finally {
      setLoading(false);
    }
  };

  const procesarCuotas = (cuotas: Cuota[], topes: Tope[]) => {
    // Normalizar posibles strings provenientes de Postgres (numeric)
    const cuotasNormalizadas = cuotas.map((cuota) => {
      const importeCuota = Number((cuota as unknown as { importecuota: unknown }).importecuota ?? cuota.importecuota ?? 0);
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
  // Usar mes/año UTC para ser consistentes con los vencimientos que vienen en UTC
  const mesActual = hoy.getUTCMonth() + 1;
  const anioActual = hoy.getUTCFullYear();
    
    const pasadasAgrupadas: CuotasPorMes = {};
    const futuras: Cuota[] = [];
    let totalMesActual = 0;

    cuotasNormalizadas.forEach((cuota) => {
      const fechaVenc = new Date(cuota.fechavencimiento);
      // Usar UTC para evitar que 00:00:00Z caiga en el día anterior por huso horario
      const mesVenc = fechaVenc.getUTCMonth() + 1;
      const anioVenc = fechaVenc.getUTCFullYear();

      if (anioVenc < anioActual || (anioVenc === anioActual && mesVenc <= mesActual)) {
        // Cuota pasada o del mes actual - agrupar por mes de VENCIMIENTO
        const keyMes = `${anioVenc}-${mesVenc}`;
        
        if (!pasadasAgrupadas[keyMes]) {
          pasadasAgrupadas[keyMes] = {
            cuotas: [],
            total: 0,
            mes: mesVenc,
            anio: anioVenc,
          };
        }
        
        pasadasAgrupadas[keyMes].cuotas.push(cuota);
        pasadasAgrupadas[keyMes].total += cuota.importecuota;
        
        if (mesVenc === mesActual && anioVenc === anioActual) {
          totalMesActual += cuota.importecuota;
        }
      } else {
        // Cuota futura
        futuras.push(cuota);
      }
    });

    setCuotasPasadasPorMes(pasadasAgrupadas);
    setCuotasFuturas(futuras);

    const topeActual = topes.find(
      (t) => Number((t as unknown as { mes: unknown }).mes ?? t.mes) === mesActual && Number((t as unknown as { anio: unknown }).anio ?? t.anio) === anioActual
    );

    const tope = topeActual ? Number((topeActual as unknown as { importe: unknown }).importe ?? topeActual.importe) : 0;
    setTopeMesActual(tope);
    setSaldoDisponible(tope - totalMesActual);
  };

  const getNombreMes = (mes: number) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[mes - 1];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const mesesOrdenados = Object.entries(cuotasPasadasPorMes).sort((a, b) => {
    const [anioA, mesA] = a[0].split('-').map(Number);
    const [anioB, mesB] = b[0].split('-').map(Number);
    if (anioB !== anioA) return anioB - anioA;
    return mesB - mesA;
  });

  const mesesAMostrar = mostrarTodosMeses ? mesesOrdenados : mesesOrdenados.slice(0, 3);

  const toggleMesExpandido = (key: string) => {
    setMesesExpandidos(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold opacity-90">Disponible este mes</h3>
          <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-5xl font-bold mb-3">
          ${saldoDisponible.toFixed(2)}
        </div>
        <div className="flex justify-between items-center text-sm opacity-90 bg-white bg-opacity-20 rounded-lg p-3 text-black">
          <div>
            <p className="text-xs">Tope del mes</p>
            <p className="font-semibold">${topeMesActual.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">Consumido</p>
            <p className="font-semibold">${(topeMesActual - saldoDisponible).toFixed(2)}</p>
          </div>
        </div>
        {saldoDisponible < 0 && (
          <div className="mt-3 bg-red-500 bg-opacity-80 rounded-lg p-2 text-center text-sm font-semibold">
             Has excedido tu límite
          </div>
        )}
      </div>

      {!verFuturas && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            Historial de Cuotas
          </h3>
          
          {mesesOrdenados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500">No hay cuotas en el historial</p>
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
                        <p className="text-xs opacity-80">Total del mes</p>
                        <p className="text-2xl font-bold">${datos.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de cuotas del mes */}
                  <div className="divide-y divide-gray-200">
                    {(mesesExpandidos[key] ? datos.cuotas : datos.cuotas.slice(0, 3)).map((cuota) => (
                      <div
                        key={cuota.idcuota}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {cuota.comercio_nombre}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Cuota {cuota.numerocuota} de {cuota.total_cuotas}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Compra: {new Date(cuota.fechacompra).toLocaleDateString("es-AR")}
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
                    
                    {/* Botón Ver más/menos dentro del mes */}
                    {datos.cuotas.length > 3 && (
                      <div className="p-3 bg-slate-100">
                        <button
                          onClick={() => toggleMesExpandido(key)}
                          className="w-full text-center text-sm text-green-600 hover:text-green-700 font-semibold py-2 hover:bg-slate-200 rounded transition"
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

              {mesesOrdenados.length > 3 && !mostrarTodosMeses && (
                <button
                  onClick={() => setMostrarTodosMeses(true)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 rounded-lg transition"
                >
                  Ver {mesesOrdenados.length - 3} meses más antiguos 
                </button>
              )}

              {mostrarTodosMeses && (
                <button
                  onClick={() => setMostrarTodosMeses(false)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 rounded-lg transition"
                >
                  Mostrar menos 
                </button>
              )}
            </>
          )}
        </div>
      )}

      {verFuturas && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">
            Próximas Cuotas a Pagar
          </h3>
          
          {cuotasFuturas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500">No hay cuotas pendientes</p>
            </div>
          ) : (
            cuotasFuturas.map((cuota) => {
              const fechaVenc = new Date(cuota.fechavencimiento);
              // Mostrar mes/año usando UTC para evitar desfases de zona horaria
              const mesCuota = fechaVenc.getUTCMonth() + 1;
              const anioCuota = fechaVenc.getUTCFullYear();
              
              return (
                <div
                  key={cuota.idcuota}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition border-l-4 border-orange-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg">
                        {cuota.comercio_nombre}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Cuota {cuota.numerocuota} de {cuota.total_cuotas}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
                          📅 {getNombreMes(mesCuota)} {anioCuota}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        ${cuota.importecuota.toFixed(2)}
                      </p>
                      <span className="inline-block mt-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                        Pendiente
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
