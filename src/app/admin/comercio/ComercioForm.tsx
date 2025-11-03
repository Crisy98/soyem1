// src/app/admin/comercio/ComercioForm.tsx
import React, { useState, useEffect } from "react";

interface Rubro {
  idrubro: number;
  nombrerubro: string;
}

interface ResultState {
  error?: string;
  message?: string;
  type?: 'success' | 'validation' | 'server' | 'network';
}

export default function ComercioForm({
  onClose,
  onSaved,
  initialData,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
}) {
  const [form, setForm] = useState({
    nombrecomercio: "",
    fechaafiliacion: "",
    calle: "",
    numerocalle: "",
    localidad: "",
    idrubro: "",
    idusuario: "1", // Temporal - deberías obtenerlo del contexto de autenticación
    activo: true,
  });

  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Cargar rubros
  useEffect(() => {
    const fetchRubros = async () => {
      try {
        const res = await fetch("/api/rubros");
        const data = await res.json();
        setRubros(data);
      } catch (err) {
        console.error("Error cargando rubros:", err);
      }
    };
    fetchRubros();
  }, []);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      console.log('InitialData recibido:', initialData);
      
      const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setForm({
        nombrecomercio: initialData.nombrecomercio || "",
        fechaafiliacion: formatDate(initialData.fechaafiliacion) || "",
        calle: initialData.calle || "",
        numerocalle: initialData.numerocalle?.toString() || "",
        localidad: initialData.localidad || "",
        idrubro: initialData.idrubro?.toString() || initialData.rubro?.idrubro?.toString() || "",
        idusuario: initialData.idusuario?.toString() || initialData.usuario?.id?.toString() || "1",
        activo: initialData.activo ?? true,
      });
    }
  }, [initialData]);

  // Validación
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombrecomercio.trim()) {
      newErrors.nombrecomercio = "El nombre del comercio es obligatorio";
    }

    if (!form.fechaafiliacion) {
      newErrors.fechaafiliacion = "La fecha de afiliación es obligatoria";
    }

    if (!form.idrubro) {
      newErrors.idrubro = "Debe seleccionar un rubro";
    }

    if (form.numerocalle && !/^\d+$/.test(form.numerocalle)) {
      newErrors.numerocalle = "El número de calle debe ser numérico";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Ejecutar validación cuando cambian los campos
  useEffect(() => {
    if (showValidationErrors) {
      validate();
    }
  }, [form, showValidationErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setShowValidationErrors(true);
    const isValid = validate();
    
    if (!isValid) {
      setResult({
        error: "Por favor, completa todos los campos obligatorios marcados con *",
        type: "validation"
      });
      
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.border-red-500');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      return;
    }

    setResult(null);
    setIsSubmitting(true);

    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData
        ? `/api/comercios/${initialData.idcomercio}`
        : "/api/comercios";
      
      const submitData = {
        nombrecomercio: form.nombrecomercio,
        fechaafiliacion: form.fechaafiliacion,
        calle: form.calle || null,
        numerocalle: form.numerocalle ? parseInt(form.numerocalle) : null,
        localidad: form.localidad || null,
        idrubro: parseInt(form.idrubro),
        idusuario: parseInt(form.idusuario),
        activo: form.activo,
      };

      console.log('Enviando datos:', submitData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setResult({
          error: `Error del servidor: ${data.error || "Error desconocido"}`,
          type: "server"
        });
        return;
      }
      
      setResult({
        message: data.message || (initialData ? "Comercio actualizado correctamente" : "Comercio creado correctamente"),
        type: "success"
      });
      
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Error al guardar:", error);
      setResult({
        error: "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.",
        type: "network"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl flex-shrink-0">
        <h1 className="text-2xl font-bold">
          {initialData ? "✏️ Modificar Comercio" : "➕ Registrar Nuevo Comercio"}
        </h1>
        <p className="text-green-100 mt-2">
          {initialData 
            ? `Editando: ${initialData.nombrecomercio}` 
            : "Complete todos los campos obligatorios para registrar un nuevo comercio"
          }
        </p>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Comercio */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Información del Comercio</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombre del Comercio *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.nombrecomercio ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Ej: Supermercado El Ahorro"
                  value={form.nombrecomercio}
                  onChange={(e) => handleChange("nombrecomercio", e.target.value)}
                />
                {errors.nombrecomercio && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.nombrecomercio}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Rubro *
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.idrubro ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  value={form.idrubro}
                  onChange={(e) => handleChange("idrubro", e.target.value)}
                >
                  <option value="">Seleccionar rubro</option>
                  {rubros.map((rubro) => (
                    <option key={rubro.idrubro} value={rubro.idrubro}>
                      {rubro.nombrerubro}
                    </option>
                  ))}
                </select>
                {errors.idrubro && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.idrubro}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha de Afiliación *
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.fechaafiliacion ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  value={form.fechaafiliacion}
                  onChange={(e) => handleChange("fechaafiliacion", e.target.value)}
                />
                {errors.fechaafiliacion && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.fechaafiliacion}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Calle
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
                  placeholder="Ej: Av. San Martín"
                  value={form.calle}
                  onChange={(e) => handleChange("calle", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Número
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.numerocalle ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Ej: 1234"
                  value={form.numerocalle}
                  onChange={(e) => handleChange("numerocalle", e.target.value.replace(/\D/g, ""))}
                />
                {errors.numerocalle && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.numerocalle}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Localidad
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
                  placeholder="Ej: Villa Regina"
                  value={form.localidad}
                  onChange={(e) => handleChange("localidad", e.target.value)}
                />
              </div>

              {/* Estado (solo visible en edición) */}
              {initialData && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-400"
                      checked={form.activo}
                      onChange={(e) => handleChange("activo", e.target.checked)}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Comercio activo
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-7">
                    Desmarque esta opción para desactivar el comercio
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`rounded-lg p-6 border-2 ${
              result.type === 'success' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300'
            }`}>
              {result.type === 'success' ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-green-800">
                    {result.message}
                  </h3>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-red-800">
                      {result.error}
                    </h3>
                  </div>
                  {result.type === 'validation' && Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Campos que requieren atención ({Object.keys(errors).length}):
                      </h4>
                      <div className="space-y-1 text-sm text-red-700">
                        {Object.entries(errors).map(([field, message]) => (
                          <div key={field} className="flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-xl">
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg shadow hover:bg-slate-300 transition-all duration-200 hover:shadow-md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 font-semibold py-3 px-6 rounded-lg shadow transition-all duration-200 flex items-center justify-center gap-2 ${
              !isSubmitting
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg hover:scale-[1.02]"
                : "bg-slate-400 text-slate-600 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {initialData ? "Guardar Cambios" : "Registrar Comercio"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}