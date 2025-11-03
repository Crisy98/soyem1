import React, { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AfiliadoList({
  afiliados,
  onEdit,
  onDelete,
  onView,
  onChangePassword,
  getAfiliadoActivo, // Nueva prop para manejar el estado correctamente
}: {
  afiliados: any[];
  onEdit: (afiliado: any) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onChangePassword: (afiliado: any) => void;
  getAfiliadoActivo: (afiliado: any) => boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSexo, setFilterSexo] = useState("todos");
  const [filterHijos, setFilterHijos] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
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

    // Normalizar el sexo para comparación (eliminar espacios y convertir a minúsculas)
    const sexoNormalizado = afiliado.persona?.sexo?.trim().toLowerCase();
    const filtroSexoNormalizado = filterSexo.trim().toLowerCase();
    const matchesSexo = 
      filterSexo === "todos" ||
      sexoNormalizado === filtroSexoNormalizado;

    const tieneHijos = afiliado.hijos && Array.isArray(afiliado.hijos) && afiliado.hijos.length > 0;
    const matchesHijos = 
      filterHijos === "todos" ||
      (filterHijos === "con_hijos" && tieneHijos) ||
      (filterHijos === "sin_hijos" && !tieneHijos);

    return matchesSearch && matchesStatus && matchesSexo && matchesHijos;
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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Listado de Afiliados - SOYEM', 14, 22);
    
    // Fecha del reporte
    doc.setFontSize(11);
    doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    
    // Información de filtros aplicados
    let yPos = 38;
    doc.setFontSize(10);
    doc.text('Filtros aplicados:', 14, yPos);
    yPos += 6;
    
    if (searchTerm) {
      doc.text(`- Búsqueda: ${searchTerm}`, 20, yPos);
      yPos += 5;
    }
    if (filterStatus !== 'todos') {
      doc.text(`- Estado: ${filterStatus === 'activos' ? 'Activos' : 'Inactivos'}`, 20, yPos);
      yPos += 5;
    }
    if (filterSexo !== 'todos') {
      doc.text(`- Sexo: ${filterSexo}`, 20, yPos);
      yPos += 5;
    }
    if (filterHijos !== 'todos') {
      doc.text(`- Hijos: ${filterHijos === 'con_hijos' ? 'Con hijos' : 'Sin hijos'}`, 20, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    doc.text(`Total de afiliados: ${filteredAfiliados.length}`, 14, yPos);
    
    // Calcular estadísticas
    const activos = filteredAfiliados.filter(a => getAfiliadoActivo(a)).length;
    const inactivos = filteredAfiliados.length - activos;
    const conHijos = filteredAfiliados.filter(a => a.hijos && a.hijos.length > 0).length;
    
    // Tabla
    const tableData = filteredAfiliados.map((afiliado) => [
      afiliado.legajo || 'N/A',
      afiliado.persona?.dni || 'N/A',
      afiliado.persona?.nombre || 'N/A',
      afiliado.persona?.apellido || 'N/A',
      afiliado.persona?.sexo || 'N/A',
      afiliado.persona?.email || 'Sin email',
      getAfiliadoActivo(afiliado) ? 'Activo' : 'Inactivo'
    ]);
    
    autoTable(doc, {
      startY: yPos + 8,
      head: [['Legajo', 'DNI', 'Nombre', 'Apellido', 'Sexo', 'Email', 'Estado']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 40 },
        6: { cellWidth: 20, halign: 'center' }
      },
      didDrawPage: (data) => {
        // Footer en cada página
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });
    
    // Resumen al final
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen:', 14, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total de afiliados: ${filteredAfiliados.length}`, 14, finalY + 17);
    doc.text(`Afiliados activos: ${activos}`, 14, finalY + 24);
    doc.text(`Afiliados inactivos: ${inactivos}`, 14, finalY + 31);
    doc.text(`Afiliados con hijos: ${conHijos}`, 14, finalY + 38);
    
    return doc;
  };

  const handlePreviewPDF = () => {
    const doc = generatePDF();
    const pdfDataUri = doc.output('dataurlstring');
    setPdfBlob(pdfDataUri);
    setShowPDFModal(true);
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    const fileName = `afiliados_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handlePrintPDF = () => {
    if (pdfBlob) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfBlob;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de filtro y búsqueda */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por DNI, nombre, apellido o email..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-900 font-medium placeholder:text-slate-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            {/* Botón para generar PDF */}
            <button
              onClick={handlePreviewPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              title="Previsualizar informe PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generar Informe
            </button>
            
            <select
              className="border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[140px] text-slate-900 font-medium"
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

            <select
              className="border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[140px] text-slate-900 font-medium"
              value={filterSexo}
              onChange={(e) => {
                setFilterSexo(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos (Sexo)</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>

            <select
              className="border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[140px] text-slate-900 font-medium"
              value={filterHijos}
              onChange={(e) => {
                setFilterHijos(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos (Hijos)</option>
              <option value="con_hijos">Con hijos</option>
              <option value="sin_hijos">Sin hijos</option>
            </select>

            <div className="text-sm text-slate-700 flex items-center px-3 font-medium">
              {filteredAfiliados.length} de {afiliados.length} afiliados
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {paginatedAfiliados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="col-span-2">Legajo</div>
                <div className="col-span-2">DNI</div>
                <div className="col-span-2">Nombre</div>
                <div className="col-span-2">Apellido</div>
                <div className="col-span-1">Email</div>
                <div className="col-span-1">Estado</div>
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
                      {afiliado.legajo || "N/A"}
                    </div>
                    <div className="col-span-2 font-medium text-slate-900">
                      {afiliado.persona?.dni || "N/A"}
                    </div>
                    <div className="col-span-2 text-slate-800">
                      {afiliado.persona?.nombre || "N/A"}
                    </div>
                    <div className="col-span-2 text-slate-800">
                      {afiliado.persona?.apellido || "N/A"}
                    </div>
                    <div className="col-span-1 text-slate-600 text-sm truncate" title={afiliado.persona?.email}>
                      {afiliado.persona?.email || "Sin email"}
                    </div>
                    <div className="col-span-1">
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
                      
                      {/* Menú desplegable */}
                      <div className="relative">
                        <button
                          className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:shadow-md"
                          onClick={() => setOpenMenuId(openMenuId === afiliado.idafiliado ? null : afiliado.idafiliado)}
                          title="Más opciones"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {openMenuId === afiliado.idafiliado && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                              onClick={() => {
                                onChangePassword(afiliado);
                                setOpenMenuId(null);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Cambiar Contraseña
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                              onClick={() => {
                                handleDelete(afiliado);
                                setOpenMenuId(null);
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
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
            <div className="text-sm text-slate-700 font-medium">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAfiliados.length)} de {filteredAfiliados.length} resultados
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'border-slate-200 text-slate-500 cursor-not-allowed bg-slate-50'
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
                    ? 'border-slate-200 text-slate-500 cursor-not-allowed bg-slate-50'
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
      
      {/* Modal de previsualización del PDF */}
      {showPDFModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Previsualización del Listado de Afiliados
              </h3>
              <button
                onClick={() => {
                  setShowPDFModal(false);
                  setPdfBlob(null);
                }}
                className="flex items-center justify-center w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                title="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Visor del PDF */}
            <div className="flex-1 overflow-hidden">
              {pdfBlob && (
                <iframe
                  src={pdfBlob}
                  className="w-full h-full border-0"
                  title="Vista previa del PDF"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}