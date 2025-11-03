'use client';
import React, { useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Movimiento {
  idcuota: string;
  idmovimiento: string;
  numeroCuota: number;
  totalCuotas: number;
  fechaVencimiento: string;
  importeCuota: number;
  fechaCompra: string;
  importeTotal: number;
  comercio: {
    idcomercio: string;
    nombrecomercio: string;
    localidad: string;
  };
  afiliado: {
    idafiliado: string;
    legajo: string;
    activo: boolean;
    persona: {
      nombre: string;
      apellido: string;
      dni: string;
      email: string;
    };
  };
}

export default function MovimientosList({
  movimientos,
}: {
  movimientos: Movimiento[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filterComercio, setFilterComercio] = useState("todos");
  const [filterAfiliado, setFilterAfiliado] = useState("todos");
  const [filterCuotas, setFilterCuotas] = useState("todas");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  // Obtener comercios y afiliados únicos para los filtros
  const comerciosUnicos = Array.from(
    new Set(movimientos.map((m) => m.comercio?.nombrecomercio).filter(Boolean))
  );
  const afiliadosUnicos = Array.from(
    new Set(movimientos.map((m) => `${m.afiliado?.persona?.nombre} ${m.afiliado?.persona?.apellido}`).filter(Boolean))
  );
  const cuotasUnicas = Array.from(
    new Set(movimientos.map((m) => m.totalCuotas).filter(Boolean))
  ).sort((a, b) => a - b);

  // Filtros
  const filteredMovimientos = movimientos.filter((movimiento) => {
    const matchesSearch = 
      movimiento.comercio?.nombrecomercio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${movimiento.afiliado?.persona?.nombre} ${movimiento.afiliado?.persona?.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movimiento.importeTotal?.toString().includes(searchTerm) ||
      movimiento.importeCuota?.toString().includes(searchTerm);

    const fechaVencimiento = new Date(movimiento.fechaVencimiento);
    const matchesFechaDesde = !fechaDesde || fechaVencimiento >= new Date(fechaDesde);
    const matchesFechaHasta = !fechaHasta || fechaVencimiento <= new Date(fechaHasta);

    const matchesComercio = 
      filterComercio === "todos" ||
      movimiento.comercio?.nombrecomercio === filterComercio;

    const matchesAfiliado = 
      filterAfiliado === "todos" ||
      `${movimiento.afiliado?.persona?.nombre} ${movimiento.afiliado?.persona?.apellido}` === filterAfiliado;

    const matchesCuotas = 
      filterCuotas === "todas" ||
      movimiento.totalCuotas?.toString() === filterCuotas;

    return matchesSearch && matchesFechaDesde && matchesFechaHasta && 
           matchesComercio && matchesAfiliado && matchesCuotas;
  });

  // Paginación
  const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovimientos = filteredMovimientos.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonthYear = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Informe de Movimientos - Cuotas', 14, 22);
    
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
    if (fechaDesde) {
      doc.text(`- Fecha desde: ${new Date(fechaDesde).toLocaleDateString('es-ES')}`, 20, yPos);
      yPos += 5;
    }
    if (fechaHasta) {
      doc.text(`- Fecha hasta: ${new Date(fechaHasta).toLocaleDateString('es-ES')}`, 20, yPos);
      yPos += 5;
    }
    if (filterComercio !== 'todos') {
      doc.text(`- Comercio: ${filterComercio}`, 20, yPos);
      yPos += 5;
    }
    if (filterAfiliado !== 'todos') {
      doc.text(`- Afiliado: ${filterAfiliado}`, 20, yPos);
      yPos += 5;
    }
    if (filterCuotas !== 'todas') {
      doc.text(`- Cuotas: ${filterCuotas}`, 20, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    doc.text(`Total de registros: ${filteredMovimientos.length}`, 14, yPos);
    
    // Calcular totales
    const totalImporteCuotas = filteredMovimientos.reduce((sum, m) => sum + m.importeCuota, 0);
    
    // Tabla
    const tableData = filteredMovimientos.map((mov) => [
      formatDateTime(mov.fechaCompra),
      formatMonthYear(mov.fechaVencimiento),
      mov.comercio?.nombrecomercio || 'N/A',
      `${mov.afiliado?.persona?.nombre || ''} ${mov.afiliado?.persona?.apellido || ''}`.trim() || 'N/A',
      mov.afiliado?.legajo || 'N/A',
      `${mov.numeroCuota}/${mov.totalCuotas}`,
      formatCurrency(mov.importeCuota),
      formatCurrency(mov.importeTotal)
    ]);
    
    autoTable(doc, {
      startY: yPos + 8,
      head: [['Fecha Compra', 'Mes Cuota', 'Comercio', 'Afiliado', 'Legajo', 'Cuota', 'Imp. Cuota', 'Total Compra']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 51, 51], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' }
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
    doc.text(`Total de cuotas: ${filteredMovimientos.length}`, 14, finalY + 17);
    doc.text(`Suma de importes de cuotas: ${formatCurrency(totalImporteCuotas)}`, 14, finalY + 24);
    
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
    const fileName = `movimientos_${new Date().toISOString().split('T')[0]}.pdf`;
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
        <div className="flex flex-col gap-4">
          {/* Búsqueda */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por comercio, afiliado o importe..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-900 font-medium placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            
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
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Rango de fechas (Vencimiento)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="date"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Filtros</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                  value={filterComercio}
                  onChange={(e) => {
                    setFilterComercio(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="todos">Todos los comercios</option>
                  {comerciosUnicos.map((comercio) => (
                    <option key={comercio} value={comercio}>
                      {comercio}
                    </option>
                  ))}
                </select>

                <select
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                  value={filterAfiliado}
                  onChange={(e) => {
                    setFilterAfiliado(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="todos">Todos los afiliados</option>
                  {afiliadosUnicos.map((afiliado) => (
                    <option key={afiliado} value={afiliado}>
                      {afiliado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Cuotas</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
                value={filterCuotas}
                onChange={(e) => {
                  setFilterCuotas(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="todas">Todas las cuotas</option>
                {cuotasUnicas.map((cuota) => (
                  <option key={cuota} value={cuota}>
                    {cuota} cuota{cuota !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-slate-700 font-medium">
            {filteredMovimientos.length} de {movimientos.length} movimientos
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {paginatedMovimientos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No se encontraron movimientos</h3>
            <p className="text-slate-500">
              {(searchTerm || fechaDesde || fechaHasta || filterComercio !== "todos" || 
               filterAfiliado !== "todos" || filterCuotas !== "todas")
                ? "Intenta ajustar tus filtros de búsqueda" 
                : "Aún no hay movimientos registrados en el sistema"}
            </p>
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 p-4 font-semibold text-slate-700 text-sm">
                <div className="col-span-2">Fecha Compra</div>
                <div className="col-span-2">Mes Cuota</div>
                <div className="col-span-2">Comercio</div>
                <div className="col-span-2">Afiliado</div>
                <div className="col-span-1">Legajo</div>
                <div className="col-span-1">Cuota</div>
                <div className="col-span-1">Importe Cuota</div>
                <div className="col-span-1">Total Compra</div>
              </div>
            </div>

            {/* Filas de la tabla */}
            <div className="divide-y divide-slate-100">
              {paginatedMovimientos.map((movimiento, index) => (
                <div
                  key={movimiento.idcuota || index}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors duration-150"
                >
                  <div className="col-span-2 font-medium text-slate-900 text-sm">
                    {formatDateTime(movimiento.fechaCompra)}
                  </div>
                  <div className="col-span-2 text-slate-700">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {formatMonthYear(movimiento.fechaVencimiento)}
                    </span>
                  </div>
                  <div className="col-span-2 text-slate-800">
                    {movimiento.comercio?.nombrecomercio || "N/A"}
                  </div>
                  <div className="col-span-2 text-slate-800">
                    {`${movimiento.afiliado?.persona?.nombre || ''} ${movimiento.afiliado?.persona?.apellido || ''}`.trim() || "N/A"}
                  </div>
                  <div className="col-span-1 text-slate-600 font-medium">
                    {movimiento.afiliado?.legajo || "N/A"}
                  </div>
                  <div className="col-span-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {movimiento.numeroCuota}/{movimiento.totalCuotas}
                    </span>
                  </div>
                  <div className="col-span-1 text-slate-800 font-semibold">
                    {formatCurrency(movimiento.importeCuota)}
                  </div>
                  <div className="col-span-1 text-slate-600">
                    {formatCurrency(movimiento.importeTotal)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700 font-medium">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredMovimientos.length)} de {filteredMovimientos.length} resultados
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
                Previsualización del Informe
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
