"use client";

import { useState } from "react";
import jsPDF from "jspdf";

interface CambiarContrasenaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: {
    id?: number;
    username: string;
    nombre: string;
    apellido: string;
    tipo: 'afiliado' | 'comercio';
  } | null;
}

export default function CambiarContrasenaAdminModal({
  isOpen,
  onClose,
  usuario,
}: CambiarContrasenaAdminModalProps) {
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generarPassword = () => {
    // Generar contraseña aleatoria de 10 caracteres
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setNuevaPassword(password);
    setShowPassword(true);
  };

  const generarPDF = () => {
    if (!usuario || !nuevaPassword) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SINDICATO SOYEM', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Cambio de Contraseña', pageWidth / 2, 25, { align: 'center' });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    let yPos = 50;
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NUEVA CONTRASEÑA GENERADA', margin, yPos);
    yPos += 15;
    
    // Información del usuario
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL USUARIO:', margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    doc.text(`Tipo: ${usuario.tipo === 'afiliado' ? 'Afiliado' : 'Comercio'}`, margin, yPos);
    yPos += 7;
    
    doc.text(`Nombre: ${usuario.nombre} ${usuario.apellido}`, margin, yPos);
    yPos += 7;
    
    doc.text(`Usuario: ${usuario.username}`, margin, yPos);
    yPos += 7;
    
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin, yPos);
    yPos += 15;
    
    // Contraseña destacada
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, 25, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NUEVA CONTRASEÑA:', margin, yPos + 5);
    yPos += 12;
    
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.setFont('courier', 'bold');
    doc.text(nuevaPassword, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 20;
    
    // Instrucciones
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTRUCCIONES IMPORTANTES:', margin, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const instrucciones = [
      '1. Guarde este documento en un lugar seguro.',
      '2. No comparta esta contraseña con nadie.',
      '3. Se recomienda cambiar la contraseña después del primer ingreso.',
      '4. La contraseña distingue entre mayúsculas y minúsculas.',
      '5. Si olvida su contraseña, contacte al administrador.'
    ];
    
    instrucciones.forEach(instruccion => {
      doc.text(instruccion, margin + 5, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // Advertencia de seguridad
    doc.setFillColor(254, 226, 226);
    doc.rect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text('⚠ ADVERTENCIA DE SEGURIDAD', margin, yPos + 3);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const advertencias = [
      'Este documento contiene información confidencial.',
      'Manténgalo en un lugar seguro y no lo comparta.'
    ];
    
    advertencias.forEach(adv => {
      doc.text(adv, margin, yPos);
      yPos += 5;
    });
    
    doc.setTextColor(0, 0, 0);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Documento generado automáticamente por el sistema SOYEM',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    
    // Guardar PDF
    const nombreArchivo = `cambio_password_${usuario.username}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usuario) {
      setError("No se ha seleccionado un usuario");
      return;
    }

    if (!nuevaPassword) {
      setError("Debe generar una contraseña primero");
      return;
    }

    if (nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const endpoint = usuario.tipo === 'afiliado' 
        ? '/api/admin/cambiar-contrasena-afiliado'
        : '/api/admin/cambiar-contrasena-comercio';

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usuario.username,
          newPassword: nuevaPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al cambiar la contraseña");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Generar PDF automáticamente
      setTimeout(() => {
        generarPDF();
      }, 500);

      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNuevaPassword("");
    setError("");
    setSuccess(false);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Cambiar Contraseña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="text-xs text-gray-500">
              Usuario: {usuario.username}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">¡Contraseña actualizada!</span>
              </div>
              <p className="text-sm">El PDF se está descargando automáticamente...</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Nueva contraseña generada:
              </p>
              <div className="bg-white p-3 rounded border border-blue-200 font-mono text-lg font-bold text-center text-red-600">
                {nuevaPassword}
              </div>
              <button
                onClick={generarPDF}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF nuevamente
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Información */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ℹ️ Generación automática de contraseña
              </p>
              <p className="text-xs text-yellow-700">
                Se generará una contraseña aleatoria de 10 caracteres que se guardará automáticamente y se descargará en PDF.
              </p>
            </div>

            {/* Botón Generar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={nuevaPassword}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 pr-10 text-slate-900 font-medium"
                    placeholder="Haga clic en generar..."
                  />
                  {nuevaPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={generarPassword}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap"
                  disabled={loading}
                >
                  🎲 Generar
                </button>
              </div>
            </div>

            {nuevaPassword && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  ✓ Contraseña generada exitosamente. Haga clic en "Guardar y Generar PDF" para aplicar los cambios.
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !nuevaPassword}
              >
                {loading ? "Guardando..." : "Guardar y Generar PDF"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
