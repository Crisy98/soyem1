"use client";

import React, { useState, useEffect } from "react";

interface Rubro {
  idrubro: number;
  nombrerubro: string;
}

export default function RubrosPage() {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRubro, setEditRubro] = useState<Rubro | null>(null);
  const [formData, setFormData] = useState({
    nombrerubro: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar rubros
  const fetchRubros = async () => {
    try {
      const res = await fetch("/api/rubros");
      const data = await res.json();
      setRubros(data);
    } catch (error) {
      console.error("Error al cargar rubros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubros();
  }, []);

  // Abrir modal para agregar
  const handleAdd = () => {
    setEditRubro(null);
    setFormData({ nombrerubro: "" });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (rubro: Rubro) => {
    setEditRubro(rubro);
    setFormData({ nombrerubro: rubro.nombrerubro });
    setShowModal(true);
  };

  // Guardar (crear o actualizar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombrerubro.trim()) {
      alert("El nombre del rubro es requerido");
      return;
    }

    try {
      if (editRubro) {
        // Actualizar
        const res = await fetch(`/api/rubros/${editRubro.idrubro}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || "Error al actualizar el rubro");
          return;
        }
      } else {
        // Crear
        const res = await fetch("/api/rubros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || "Error al crear el rubro");
          return;
        }
      }

      setShowModal(false);
      fetchRubros();
    } catch (error) {
      console.error("Error al guardar rubro:", error);
      alert("Error al guardar el rubro");
    }
  };

  // Eliminar
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este rubro?")) return;

    try {
      const res = await fetch(`/api/rubros/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Error al eliminar el rubro");
        return;
      }

      fetchRubros();
    } catch (error) {
      console.error("Error al eliminar rubro:", error);
      alert("Error al eliminar el rubro");
    }
  };

  // Filtrar rubros por búsqueda
  const filteredRubros = rubros.filter(rubro =>
    rubro.nombrerubro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Rubros</h2>
          <p className="text-sm text-gray-600 mt-1">
            Categorías para clasificar comercios • Total: {rubros.length}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Rubro
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar rubros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de rubros */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Lista de Rubros ({filteredRubros.length})
          </h3>
        </div>

        {filteredRubros.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No se encontraron rubros" : "No hay rubros registrados"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAdd}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Agregar el primer rubro
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredRubros.map((rubro) => (
              <div
                key={rubro.idrubro}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {rubro.nombrerubro}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {rubro.idrubro}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-green-200">
                  <button
                    onClick={() => handleEdit(rubro)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(rubro.idrubro)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editRubro ? "Editar Rubro" : "Agregar Nuevo Rubro"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Rubro *
                </label>
                <input
                  type="text"
                  value={formData.nombrerubro}
                  onChange={(e) => setFormData({ nombrerubro: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Supermercados, Farmacias, etc."
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  {editRubro ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
