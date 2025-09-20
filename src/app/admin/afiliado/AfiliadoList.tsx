import React, { useState } from "react";

export default function AfiliadoList({
  afiliados,
  onEdit,
  onDelete,
  onView,
  getAfiliadoActivo, // Nueva prop para manejar el estado correctamente
}: {
  afiliados: any[];
  onEdit: (afiliado: any) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  getAfiliadoActivo: (afiliado: any) => boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtros corregidos
  const filteredAfiliados = afiliados.filter((afiliado) => {
    const matchesSearch = 
      afiliado.persona?.dni?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.persona?.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      afiliado.persona?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = getAfiliadoActivo(afiliado);
    const matchesStatus = 
      filterStatus === "todos" ||
      (filterStatus === "activos" && isActive) ||
      (filterStatus === "inactivos" && !isActive);

    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredAfiliados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAfiliados = filteredAfiliados.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const handleDelete = (afiliado: any) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${afiliado.persona?.nombre} ${afiliado.persona?.apellido}?`)) {
      onDelete(afiliado.idafiliado || afiliado.afiliado?.idafiliado);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de filtro y búsqueda */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por DNI, nombre, apellido o email..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              className="border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[140px]"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>

            <div className="text-sm text-slate-500 flex items-center px-3">
              {filteredAfiliados.length} de {afiliados.length} afiliados
            </div>
          </div>
        </div>

        {/* Debug info - Remover en producción */}
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Debug:</strong> 
          Total: {afiliados.length}, 
          Activos: {afiliados.filter(a => getAfiliadoActivo(a)).length}, 
          Filtrados: {filteredAfiliados.length}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {paginatedAfiliados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No se encontraron afiliados</h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== "todos" 
                ? "Intenta ajustar tus filtros de búsqueda" 
                : "Aún no hay afiliados registrados en el sistema"}
            </p>
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-slate-700 text-sm">
                <div className="col-span-2">DNI</div>
                <div className="col-span-2">Nombre</div>
                <div className="col-span-2">Apellido</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
            </div>

            {/* Filas de la tabla */}
            <div className="divide-y divide-slate-100">
              {paginatedAfiliados.map((afiliado, index) => {
                const isActive = getAfiliadoActivo(afiliado);
                
                return (
                  <div
                    key={afiliado.idafiliado || afiliado.afiliado?.idafiliado || index}
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div className="col-span-2 font-medium text-slate-900">
                      {afiliado.persona?.dni || "N/A"}
                    </div>
                    <div className="col-span-2 text-slate-800">
                      {afiliado.persona?.nombre || "N/A"}
                    </div>
                    <div className="col-span-2 text-slate-800">
                      {afiliado.persona?.apellido || "N/A"}
                    </div>
                    <div className="col-span-2 text-slate-600 text-sm truncate" title={afiliado.persona?.email}>
                      {afiliado.persona?.email || "Sin email"}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isActive ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                            Activo
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></div>
                            Inactivo
                          </>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center gap-2">
                      <button
                        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:shadow-md"
                        onClick={() => onView(afiliado.idafiliado || afiliado.afiliado?.idafiliado)}
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver
                      </button>
                      <button
                        className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:shadow-md"
                        onClick={() => onEdit(afiliado)}
                        title="Editar afiliado"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:shadow-md"
                        onClick={() => handleDelete(afiliado)}
                        title="Eliminar afiliado"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAfiliados.length)} de {filteredAfiliados.length} resultados
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}