"use client";

import React, { useState, useEffect } from "react";
import type { FC } from 'react';
import ComercioList from "./ComercioList";
import ComercioForm from "./ComercioForm";
import Modal from "../afiliado/Modal";
import CambiarContrasenaModal from "@/components/CambiarContrasenaModal";
import CambiarContrasenaAdminModal from "@/components/CambiarContrasenaAdminModal";

export default function ComerciosPage() {
  const [comercios, setComercios] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editComercio, setEditComercio] = useState<any>(null);
  const [viewComercio, setViewComercio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);
  const [comercioParaCambiarPassword, setComercioParaCambiarPassword] = useState<any>(null);

  // Cargar comercios
  const fetchComercios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/comercios");
      if (!res.ok) {
        throw new Error('Error al cargar comercios');
      }
      const data = await res.json();
      setComercios(data);
    } catch (err) {
      console.error("Error cargando comercios:", err);
      alert("Error al cargar los comercios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComercios();
  }, []);

  // Eliminar (desactivar)
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comercios/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error('Error al eliminar comercio');
      }
      await fetchComercios();
    } catch (err) {
      console.error("Error eliminando comercio:", err);
      alert("Error al eliminar el comercio");
    }
  };

  // Agregar
  const handleAdd = () => {
    setEditComercio(null);
    setViewComercio(null);
    setShowModal(true);
  };

  // Editar
  const handleEdit = (comercio: any) => {
    setEditComercio(comercio);
    setViewComercio(null);
    setShowModal(true);
  };

  // Ver comercio completo
  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/comercios/${id}`);
      if (!res.ok) {
        throw new Error('Error al cargar detalle');
      }
      const data = await res.json();
      setViewComercio(data);
      setEditComercio(null);
      setShowModal(true);
    } catch (err) {
      console.error("Error cargando detalle del comercio:", err);
      alert("Error al cargar el detalle del comercio");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Función para abrir el modal de cambio de contraseña para un comercio específico
  const handleChangePassword = async (comercio: any) => {
    // Obtener el usuario del comercio
    const idcomercio = comercio.idcomercio;
    
    try {
      const res = await fetch(`/api/comercios/${idcomercio}`);
      const data = await res.json();
      
      if (data.usuario) {
        setComercioParaCambiarPassword({
          id: data.usuario.id,
          username: data.usuario.username,
          nombre: data.nombrecomercio,
          apellido: '', // Los comercios no tienen apellido
          tipo: 'comercio' as const
        });
        setMostrarCambiarContrasena(true);
      } else {
        alert('Este comercio no tiene un usuario asignado en el sistema');
      }
    } catch (error) {
      console.error('Error obteniendo datos del comercio:', error);
      alert('Error al obtener los datos del comercio');
    }
  };

  // Conteo de comercios activos
  const comerciosActivos = comercios.filter(c => c.activo ?? true).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Más compacto */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Comercios</h2>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Total: {comercios.length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Activos: {comerciosActivos}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Inactivos: {comercios.length - comerciosActivos}
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
          Agregar Comercio
        </button>
      </div>

      {/* Lista de Comercios */}
      <ComercioList
        comercios={comercios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onChangePassword={handleChangePassword}
      />

      {/* Modal para agregar/editar */}
      {showModal && !viewComercio && (
        <Modal onClose={() => {
          setShowModal(false);
          setEditComercio(null);
        }}>
          <ComercioForm
            onClose={() => {
              setShowModal(false);
              setEditComercio(null);
            }}
            onSaved={() => {
              fetchComercios();
              setShowModal(false);
              setEditComercio(null);
            }}
            initialData={editComercio}
          />
        </Modal>
      )}

      {/* Modal para ver comercio */}
      {showModal && viewComercio && (
        <Modal onClose={() => {
          setShowModal(false);
          setViewComercio(null);
        }}>
          <div className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Detalle del Comercio</h2>
                  <p className="text-green-100 mt-1">
                    {viewComercio.nombrecomercio}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (viewComercio.activo ?? true)
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {(viewComercio.activo ?? true) ? '✓ Activo' : '✗ Inactivo'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Información General</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
                    <p className="text-slate-900 font-medium text-lg">{viewComercio.nombrecomercio}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rubro</label>
                    <p className="text-slate-900 font-medium">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {viewComercio.rubro?.nombrerubro || "Sin rubro"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de Afiliación</label>
                    <p className="text-slate-900 font-medium">{formatDate(viewComercio.fechaafiliacion)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Comercio</label>
                    <p className="text-slate-900 font-medium">{viewComercio.idcomercio}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Ubicación</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dirección</label>
                    <p className="text-slate-900 font-medium">
                      {viewComercio.calle && viewComercio.numerocalle 
                        ? `${viewComercio.calle} ${viewComercio.numerocalle}`
                        : viewComercio.calle || "No especificada"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Localidad</label>
                    <p className="text-slate-900 font-medium">{viewComercio.localidad || "No especificada"}</p>
                  </div>
                </div>
              </div>

              {/* Información de Usuario */}
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Usuario Asociado</h3>
                </div>
                
                {viewComercio.usuario ? (
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</label>
                        <p className="text-slate-900 font-medium">{viewComercio.usuario.username}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Usuario</label>
                        <p className="text-slate-900 font-medium">{viewComercio.usuario.id}</p>
                      </div>
                    </div>
                    {viewComercio.usuario.roles && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roles</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {viewComercio.usuario.roles.split(',').map((role: string, index: number) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                              {role.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-lg">No tiene usuario asignado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setViewComercio(null);
                    setShowModal(false);
                  }}
                  className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setEditComercio(viewComercio);
                    setViewComercio(null);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
          setComercioParaCambiarPassword(null);
        }}
        usuario={comercioParaCambiarPassword}
      />
    </div>
  );
}