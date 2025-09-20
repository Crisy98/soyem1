"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AfiliadoForm from "./AfiliadoForm";

// Definir las interfaces para el tipado
interface Persona {
  dni: string;
  nombre: string;
  apellido: string;
  fechanacimiento: string;
  telefono: string;
  email: string;
  sexo: string;
}

interface Afiliado {
  idafiliado: string;
  area: string;
  cargo: string;
  tipocontratacion: string;
  legajo: number;
  categoria: number;
  fechaafiliacion: string;
  fechamunicipio: string;
  lugartrabajo: string;
  activo?: boolean;
}

interface AfiliadoCompleto {
  persona: Persona;
  afiliado: Afiliado;
  activo?: boolean;
}

export default function EditAfiliadoPage() {
  const router = useRouter();
  const params = useParams();
  const afiliadoId = params?.id;
  
  const [afiliado, setAfiliado] = useState<AfiliadoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAfiliado = async () => {
      try {
        // Primero intentar cargar desde localStorage (si viene de la lista)
        const storedAfiliado = localStorage.getItem('editingAfiliado');
        if (storedAfiliado) {
          const parsedAfiliado = JSON.parse(storedAfiliado);
          setAfiliado(parsedAfiliado);
          localStorage.removeItem('editingAfiliado'); // Limpiar después de usar
          setLoading(false);
          return;
        }

        // Si no hay datos en localStorage, cargar desde la API
        if (afiliadoId) {
          const response = await fetch(`/api/afiliados/${afiliadoId}`);
          if (!response.ok) {
            throw new Error('Error al cargar el afiliado');
          }
          const data = await response.json();
          setAfiliado(data);
        } else {
          throw new Error('ID de afiliado no encontrado');
        }
              } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadAfiliado();
  }, [afiliadoId]);

  const handleSaved = () => {
    // Regresar a la lista de afiliados después de guardar
    router.push('/afiliados');
  };

  const handleCancel = () => {
    router.back(); // Regresar a la página anterior
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-slate-700 font-medium">Cargando datos del afiliado...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Regresar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Regresar"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Editar Afiliado
                </h1>
                <p className="text-slate-600 mt-1">
                  {afiliado?.persona?.nombre} {afiliado?.persona?.apellido} - DNI: {afiliado?.persona?.dni}
                </p>
              </div>
            </div>
            
            {/* Estado del afiliado */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              (afiliado?.activo ?? afiliado?.afiliado?.activo ?? true)
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {(afiliado?.activo ?? afiliado?.afiliado?.activo ?? true) ? '✓ Activo' : '✗ Inactivo'}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <AfiliadoForm
            onClose={handleCancel}
            onSaved={handleSaved}
            initialData={afiliado}
            isFullPage={true} // Nueva prop para indicar que es página completa
          />
        </div>
      </div>
    </div>
  );
}