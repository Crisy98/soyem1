import React, { useState, useEffect } from "react";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateNumber(value: string) {
  return /^\d+$/.test(value);
}

interface Hijo {
  nombre: string;
  sexo: string;
  fechanacimiento: string;
}

interface ResultState {
  error?: string;
  message?: string;
  username?: string;
  password?: string;
  type?: 'success' | 'validation' | 'server' | 'network';
}

export default function AfiliadoForm({
  onClose,
  onSaved,
  initialData,
  isFullPage = false,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
  isFullPage?: boolean;
}) {
  const [form, setForm] = useState({
    persona: {
      dni: "",
      nombre: "",
      apellido: "",
      fechanacimiento: "",
      telefono: "",
      email: "",
      sexo: "",
    },
    afiliado: {
      idafiliado: "",
      area: "",
      cargo: "",
      tipocontratacion: "",
      legajo: "",
      categoria: "",
      fechaafiliacion: "",
      fechamunicipio: "",
      lugartrabajo: "",
    },
    hijos: [] as Hijo[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      console.log('InitialData recibido en AfiliadoForm:', initialData);

      const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Extraer datos de persona - puede venir anidado o directo
      const personaData = initialData.persona || {
        dni: initialData.dni,
        nombre: initialData.nombre,
        apellido: initialData.apellido,
        fechanacimiento: initialData.fechanacimiento,
        telefono: initialData.telefono,
        email: initialData.email,
        sexo: initialData.sexo
      };

      // Extraer datos de afiliado - puede venir anidado o directo
      const afiliadoData = initialData.afiliado || {
        idafiliado: initialData.idafiliado,
        area: initialData.area,
        cargo: initialData.cargo,
        tipocontratacion: initialData.tipocontratacion,
        legajo: initialData.legajo,
        categoria: initialData.categoria,
        fechaafiliacion: initialData.fechaafiliacion,
        fechamunicipio: initialData.fechamunicipio,
        lugartrabajo: initialData.lugartrabajo
      };

      const formData = {
        persona: {
          dni: personaData.dni?.toString() || "",
          nombre: personaData.nombre || "",
          apellido: personaData.apellido || "",
          fechanacimiento: formatDate(personaData.fechanacimiento) || "",
          telefono: personaData.telefono?.toString() || "",
          email: personaData.email || "",
          sexo: personaData.sexo || "",
        },
        afiliado: {
          idafiliado: afiliadoData.idafiliado?.toString() || "",
          area: afiliadoData.area || "",
          cargo: afiliadoData.cargo || "",
          tipocontratacion: afiliadoData.tipocontratacion || "",
          legajo: afiliadoData.legajo?.toString() || "",
          categoria: afiliadoData.categoria?.toString() || "",
          fechaafiliacion: formatDate(afiliadoData.fechaafiliacion) || "",
          fechamunicipio: formatDate(afiliadoData.fechamunicipio) || "",
          lugartrabajo: afiliadoData.lugartrabajo || "",
        },
        hijos: (initialData.hijos || []).map((hijo: any) => ({
          nombre: hijo.nombre || "",
          sexo: hijo.sexo || "",
          fechanacimiento: formatDate(hijo.fechanacimiento) || "",
        })),
      };

      console.log('Datos del formulario después de procesar:', formData);
      setForm(formData);
    }
  }, [initialData]);

  // Validación mejorada
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Persona
    if (!form.persona.dni.trim()) {
      newErrors.dni = "El DNI es obligatorio";
    } else if (!validateNumber(form.persona.dni)) {
      newErrors.dni = "El DNI solo debe contener números";
    }

    if (!form.persona.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!form.persona.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio";
    }

    if (!form.persona.fechanacimiento) {
      newErrors.fechanacimiento = "La fecha de nacimiento es obligatoria";
    }

    if (!form.persona.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
    } else if (!validateNumber(form.persona.telefono)) {
      newErrors.telefono = "El teléfono solo debe contener números";
    }

    if (!form.persona.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!validateEmail(form.persona.email)) {
      newErrors.email = "El formato del email no es válido";
    }

    if (!form.persona.sexo) {
      newErrors.sexo = "Debe seleccionar un sexo";
    }

    // Afiliado
    if (!form.afiliado.idafiliado.trim()) {
      newErrors.idafiliado = "El ID de afiliado es obligatorio";
    }

    if (!form.afiliado.area.trim()) {
      newErrors.area = "El área es obligatoria";
    }

    if (!form.afiliado.cargo.trim()) {
      newErrors.cargo = "El cargo es obligatorio";
    }

    if (!form.afiliado.tipocontratacion) {
      newErrors.tipocontratacion = "Debe seleccionar un tipo de contratación";
    }

    if (!form.afiliado.legajo.trim()) {
      newErrors.legajo = "El legajo es obligatorio";
    }

    if (!form.afiliado.categoria.trim()) {
      newErrors.categoria = "La categoría es obligatoria";
    }

    if (!form.afiliado.fechaafiliacion) {
      newErrors.fechaafiliacion = "La fecha de afiliación es obligatoria";
    }

    if (!form.afiliado.fechamunicipio) {
      newErrors.fechamunicipio = "La fecha de municipio es obligatoria";
    }

    if (!form.afiliado.lugartrabajo.trim()) {
      newErrors.lugartrabajo = "El lugar de trabajo es obligatorio";
    }

    // Validar hijos
    form.hijos.forEach((hijo: Hijo, idx: number) => {
      if (!hijo.nombre.trim()) {
        newErrors[`hijo_nombre_${idx}`] = "El nombre del hijo es obligatorio";
      }
      if (!hijo.sexo) {
        newErrors[`hijo_sexo_${idx}`] = "Debe seleccionar el sexo del hijo";
      }
      if (!hijo.fechanacimiento) {
        newErrors[`hijo_fechanacimiento_${idx}`] = "La fecha de nacimiento del hijo es obligatoria";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Ejecutar validación cuando cambian los campos (solo si ya se intentó enviar)
  useEffect(() => {
    if (showValidationErrors) {
      validate();
    }
  }, [form, showValidationErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Activar la visualización de errores
    setShowValidationErrors(true);

    // FORZAR validación antes de enviar
    const isValid = validate();
    
    if (!isValid) {
      // Limpiar resultado anterior y mostrar error de validación
      setResult({
        error: "Por favor, completa todos los campos obligatorios marcados con *",
        type: "validation"
      });
      
      // Contar errores
      const errorCount = Object.keys(errors).length;
      console.log(`Se encontraron ${errorCount} errores de validación`);
      
      // Hacer scroll al primer error
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

    // Limpiar errores de validación si todo está bien
    setResult(null);
    setIsSubmitting(true);

    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData
        ? `/api/afiliados/${form.afiliado.idafiliado}`
        : "/api/afiliados";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        message: data.message,
        username: data.username,
        password: data.password,
        type: "success"
      });
      
      // Esperar un momento para mostrar el resultado antes de cerrar
      setTimeout(() => {
        onSaved();
        onClose();
      }, 2000);
      
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

  const addHijo = () => {
    setForm({
      ...form,
      hijos: [...form.hijos, { nombre: "", sexo: "", fechanacimiento: "" }],
    });
  };

  const removeHijo = (index: number) => {
    const newHijos = form.hijos.filter((_, i) => i !== index);
    setForm({ ...form, hijos: newHijos });
  };

  const handleChange = (section: string, field: string, value: string) => {
    setForm({
      ...form,
      [section]: { ...form[section as keyof typeof form], [field]: value },
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0">
        <h1 className="text-2xl font-bold">
          {initialData ? "✏️ Modificar Afiliado" : "➕ Registrar Nuevo Afiliado"}
        </h1>
        <p className="text-blue-100 mt-2">
          {initialData 
            ? `Editando: ${initialData.persona?.nombre} ${initialData.persona?.apellido}` 
            : "Complete todos los campos obligatorios para registrar un nuevo afiliado"
          }
        </p>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Persona */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Información Personal</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  DNI *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.dni ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  placeholder="Ej: 12345678"
                  value={form.persona.dni}
                  onChange={(e) =>
                    handleChange("persona", "dni", e.target.value.replace(/\D/g, ""))
                  }
                />
                {errors.dni && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.dni}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombre *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.nombre ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  placeholder="Ej: Juan"
                  value={form.persona.nombre}
                  onChange={(e) =>
                    handleChange("persona", "nombre", e.target.value)
                  }
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Apellido *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.apellido ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  placeholder="Ej: Pérez"
                  value={form.persona.apellido}
                  onChange={(e) =>
                    handleChange("persona", "apellido", e.target.value)
                  }
                />
                {errors.apellido && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.apellido}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha de nacimiento *
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.fechanacimiento ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  value={form.persona.fechanacimiento}
                  onChange={(e) =>
                    handleChange("persona", "fechanacimiento", e.target.value)
                  }
                />
                {errors.fechanacimiento && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.fechanacimiento}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Teléfono *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.telefono ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  placeholder="Ej: 2991234567"
                  value={form.persona.telefono}
                  onChange={(e) =>
                    handleChange("persona", "telefono", e.target.value.replace(/\D/g, ""))
                  }
                />
                {errors.telefono && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.telefono}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.email ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  placeholder="Ej: correo@mail.com"
                  value={form.persona.email}
                  onChange={(e) =>
                    handleChange("persona", "email", e.target.value)
                  }
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.email}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Sexo *
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    errors.sexo ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-400"
                  }`}
                  value={form.persona.sexo}
                  onChange={(e) =>
                    handleChange("persona", "sexo", e.target.value)
                  }
                >
                  <option value="">Seleccionar sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.sexo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.sexo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Afiliado */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Información Laboral</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ID Afiliado *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.idafiliado ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="ID único del afiliado"
                  value={form.afiliado.idafiliado}
                  onChange={(e) =>
                    handleChange("afiliado", "idafiliado", e.target.value)
                  }
                />
                {errors.idafiliado && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.idafiliado}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Área *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.area ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Ej: Administración"
                  value={form.afiliado.area}
                  onChange={(e) =>
                    handleChange("afiliado", "area", e.target.value)
                  }
                />
                {errors.area && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.area}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cargo *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.cargo ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Ej: Secretario"
                  value={form.afiliado.cargo}
                  onChange={(e) =>
                    handleChange("afiliado", "cargo", e.target.value)
                  }
                />
                {errors.cargo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.cargo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tipo de contratación *
                </label>
                <select
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.tipocontratacion ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  value={form.afiliado.tipocontratacion}
                  onChange={(e) =>
                    handleChange("afiliado", "tipocontratacion", e.target.value)
                  }
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Planta Permanente">Planta Permanente</option>
                  <option value="Contratado">Contratado</option>
                  <option value="Transitorio">Transitorio</option>
                </select>
                {errors.tipocontratacion && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.tipocontratacion}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Legajo *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.legajo ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Número de legajo"
                  value={form.afiliado.legajo}
                  onChange={(e) =>
                    handleChange("afiliado", "legajo", e.target.value)
                  }
                />
                {errors.legajo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.legajo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Categoría *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.categoria ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Categoría laboral"
                  value={form.afiliado.categoria}
                  onChange={(e) =>
                    handleChange("afiliado", "categoria", e.target.value)
                  }
                />
                {errors.categoria && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.categoria}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha de afiliación *
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.fechaafiliacion ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  value={form.afiliado.fechaafiliacion}
                  onChange={(e) =>
                    handleChange("afiliado", "fechaafiliacion", e.target.value)
                  }
                />
                {errors.fechaafiliacion && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.fechaafiliacion}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha municipio *
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.fechamunicipio ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  value={form.afiliado.fechamunicipio}
                  onChange={(e) =>
                    handleChange("afiliado", "fechamunicipio", e.target.value)
                  }
                />
                {errors.fechamunicipio && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.fechamunicipio}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lugar de trabajo *
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all ${
                    errors.lugartrabajo ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-green-400"
                  }`}
                  placeholder="Dirección del lugar de trabajo"
                  value={form.afiliado.lugartrabajo}
                  onChange={(e) =>
                    handleChange("afiliado", "lugartrabajo", e.target.value)
                  }
                />
                {errors.lugartrabajo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {errors.lugartrabajo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Hijos */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Hijos ({form.hijos.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={addHijo}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar hijo
              </button>
            </div>
            
            {form.hijos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-slate-500 text-lg">No hay hijos agregados</p>
                <p className="text-slate-400 text-sm mt-1">Presiona "Agregar hijo" para incluir información de hijos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.hijos.map((hijo: Hijo, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-5 border border-purple-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Hijo #{idx + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeHijo(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Nombre del hijo *
                        </label>
                        <input
                          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                            errors[`hijo_nombre_${idx}`] ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-purple-400"
                          }`}
                          placeholder="Nombre completo"
                          value={hijo.nombre}
                          onChange={(e) => {
                            const hijos = [...form.hijos];
                            hijos[idx].nombre = e.target.value;
                            setForm({ ...form, hijos });
                          }}
                        />
                        {errors[`hijo_nombre_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <span className="text-red-400">⚠</span> {errors[`hijo_nombre_${idx}`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Sexo *
                        </label>
                        <select
                          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                            errors[`hijo_sexo_${idx}`] ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-purple-400"
                          }`}
                          value={hijo.sexo}
                          onChange={(e) => {
                            const hijos = [...form.hijos];
                            hijos[idx].sexo = e.target.value;
                            setForm({ ...form, hijos });
                          }}
                        >
                          <option value="">Seleccionar</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                        {errors[`hijo_sexo_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <span className="text-red-400">⚠</span> {errors[`hijo_sexo_${idx}`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Fecha de nacimiento *
                        </label>
                        <input
                          type="date"
                          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                            errors[`hijo_fechanacimiento_${idx}`] ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-purple-400"
                          }`}
                          value={hijo.fechanacimiento}
                          onChange={(e) => {
                            const hijos = [...form.hijos];
                            hijos[idx].fechanacimiento = e.target.value;
                            setForm({ ...form, hijos });
                          }}
                        />
                        {errors[`hijo_fechanacimiento_${idx}`] && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <span className="text-red-400">⚠</span> {errors[`hijo_fechanacimiento_${idx}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resultado y Errores */}
          {result && (
            <div className={`rounded-lg p-6 border-2 ${
              result.type === 'success' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300'
            }`}>
              {result.type === 'success' ? (
                <div className="flex items-center gap-3 mb-3">
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-red-800">
                    {result.error}
                  </h3>
                </div>
              )}
              
              {result.type === 'validation' && Object.keys(errors).length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Campos que requieren atención ({Object.keys(errors).length}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(errors).map(([field, message]: [string, string]) => (
                      <div key={field} className="flex items-center gap-2 text-red-700">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{message}</span>
                      </div>
                    ))}
                  </div>
                  </div>
                
              )}
              
              {result.username && result.password && (
                <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Credenciales de acceso:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">Usuario:</label>
                      <p className="text-green-900 font-mono bg-green-50 p-2 rounded border">{result.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Contraseña:</label>
                      <p className="text-green-900 font-mono bg-green-50 p-2 rounded border">{result.password}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Footer - Fixed */}
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
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-[1.02]"
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
                {initialData ? "Guardar Cambios" : "Registrar Afiliado"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}