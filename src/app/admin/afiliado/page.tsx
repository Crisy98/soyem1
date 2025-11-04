"use client";

import React, { useState, useEffect } from "react";
import AfiliadoList from "./AfiliadoList";
import AfiliadoForm from "./AfiliadoForm";
import Modal from "./Modal";
import CambiarContrasenaModal from "@/components/CambiarContrasenaModal";
import CambiarContrasenaAdminModal from "@/components/CambiarContrasenaAdminModal";

export default function AfiliadosPage() {
  const [afiliados, setAfiliados] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editAfiliado, setEditAfiliado] = useState<any>(null);
  const [viewAfiliado, setViewAfiliado] = useState<any>(null);
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);
  const [afiliadoParaCambiarPassword, setAfiliadoParaCambiarPassword] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editar
  const handleEdit = (afiliado: any) => {
    setEditAfiliado(afiliado);
    setShowModal(true);
  };

  // Cargar afiliados
  const fetchAfiliados = async () => {
    const res = await fetch("/api/afiliados");
    const data = await res.json();
    setAfiliados(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAfiliados();
  }, []);

  // Eliminar (desactivar)
  const handleDelete = async (id: string) => {
    await fetch(`/api/afiliados/${id}`, { method: "DELETE" });
    fetchAfiliados();
  };

  // Agregar
  const handleAdd = () => {
    setEditAfiliado(null);
    setShowModal(true);
  };

  // Ver afiliado completo
  const handleView = async (id: string) => {
    const res = await fetch(`/api/afiliados/${id}`);
    const data = await res.json();
    setViewAfiliado(data);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Función helper para obtener el estado activo correctamente
  const getAfiliadoActivo = (afiliado: any) => {
    return afiliado?.activo ?? afiliado?.afiliado?.activo ?? true;
  };

  // Función para abrir el modal de cambio de contraseña para un afiliado específico
  const handleChangePassword = async (afiliado: any) => {
    // Obtener el usuario del afiliado
    const idafiliado = afiliado.idafiliado || afiliado.afiliado?.idafiliado;
    
    try {
      const res = await fetch(`/api/afiliados/${idafiliado}`);
      const data = await res.json();
      
      if (data.usuario) {
        setAfiliadoParaCambiarPassword({
          id: data.usuario.id,
          username: data.usuario.username,
          nombre: data.persona.nombre,
          apellido: data.persona.apellido,
          tipo: 'afiliado' as const
        });
        setMostrarCambiarContrasena(true);
      } else {
        alert('Este afiliado no tiene un usuario asignado en el sistema');
      }
    } catch (error) {
      console.error('Error obteniendo datos del afiliado:', error);
      alert('Error al obtener los datos del afiliado');
    }
  };

  // Conteo correcto de afiliados activos
  const afiliadosActivos = afiliados.filter(afiliado => getAfiliadoActivo(afiliado)).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Más compacto */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Afiliados</h2>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Total: {afiliados.length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Activos: {afiliadosActivos}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Inactivos: {afiliados.length - afiliadosActivos}
            </span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition font-semibold"
          onClick={handleAdd}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Afiliado
        </button>
      </div>

      {/* Lista de Afiliados */}
      <AfiliadoList
        afiliados={afiliados}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onChangePassword={handleChangePassword}
        getAfiliadoActivo={getAfiliadoActivo}
      />

      {/* Modal para agregar/editar */}
      {showModal && !viewAfiliado && (
        <Modal onClose={() => {
          setShowModal(false);
          setEditAfiliado(null);
        }}>
          <AfiliadoForm
            onClose={() => {
              setShowModal(false);
              setEditAfiliado(null);
            }}
            onSaved={() => {
              fetchAfiliados();
              setShowModal(false);
              setEditAfiliado(null);
            }}
            initialData={editAfiliado}
          />
        </Modal>
      )}

      {/* Modal para ver afiliado */}
      {showModal && viewAfiliado && (
        <Modal onClose={() => {
          setShowModal(false);
          setViewAfiliado(null);
        }}>
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Perfil del Afiliado</h2>
                  <p className="text-blue-100 mt-1">
                    {viewAfiliado.persona.nombre} {viewAfiliado.persona.apellido}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getAfiliadoActivo(viewAfiliado)
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {getAfiliadoActivo(viewAfiliado) ? '✓ Activo' : '✗ Inactivo'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Información Personal */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Información Personal</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">DNI</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.persona.dni}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sexo</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.persona.sexo}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre completo</label>
                      <p className="text-slate-900 font-medium text-lg">
                        {viewAfiliado.persona.nombre} {viewAfiliado.persona.apellido}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                        <p className="text-slate-900 font-medium break-all">{viewAfiliado.persona.email || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Teléfono</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.persona.telefono || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de nacimiento</label>
                      <p className="text-slate-900 font-medium">{formatDate(viewAfiliado.persona.fechanacimiento)}</p>
                    </div>
                  </div>
                </div>

                {/* Información Laboral */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Información Laboral</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Área</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.area || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cargo</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.cargo || "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legajo</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.legajo || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo contratación</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.tipocontratacion || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lugar de trabajo</label>
                      <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.lugartrabajo || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha afiliación</label>
                        <p className="text-slate-900 font-medium">{formatDate(viewAfiliado.afiliado?.fechaafiliacion)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Municipio</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.afiliado?.fechamunicipio || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Hijos */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Hijos ({viewAfiliado.hijos?.length || 0})
                  </h3>
                </div>
                {!viewAfiliado.hijos || viewAfiliado.hijos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg">No tiene hijos registrados</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewAfiliado.hijos.map((hijo: any, index: number) => (
                      <div key={hijo.idhijo || index} className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            hijo.sexo === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}>
                            {hijo.nombre?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{hijo.nombre || "Sin nombre"}</p>
                            <p className="text-sm text-slate-500">{hijo.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha nacimiento</label>
                          <p className="text-slate-900 font-medium">{formatDate(hijo.fechanacimiento)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Información de Usuario */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Acceso al Sistema</h3>
                </div>
                {viewAfiliado.usuario ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</label>
                        <p className="text-slate-900 font-medium">{viewAfiliado.usuario.username}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roles</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewAfiliado.usuario.roles?.split(',').map((role: string, index: number) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                              {role.trim()}
                            </span>
                          )) || <span className="text-slate-500">Sin roles</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg">No tiene usuario asignado</p>
                    <p className="text-slate-500 text-sm mt-1">Este afiliado no puede acceder al sistema</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setViewAfiliado(null);
                    setShowModal(false);
                  }}
                  className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('editingAfiliado', JSON.stringify(viewAfiliado));
                    window.location.href = `/afiliados/editar/${viewAfiliado.idafiliado || viewAfiliado.afiliado?.idafiliado}`;
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <CambiarContrasenaAdminModal
        isOpen={mostrarCambiarContrasena}
        onClose={() => {
          setMostrarCambiarContrasena(false);
          setAfiliadoParaCambiarPassword(null);
        }}
        usuario={afiliadoParaCambiarPassword}
      />
    </div>
  );
}
