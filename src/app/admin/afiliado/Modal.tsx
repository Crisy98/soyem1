import React, { useEffect } from "react";

export default function Modal({ 
  children, 
  onClose, 
  maxWidth = "max-w-4xl" 
}: { 
  children: React.ReactNode; 
  onClose: () => void;
  maxWidth?: string;
}) {
  // Cerrar modal con ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl relative w-full ${maxWidth} transform transition-all duration-200 scale-100 opacity-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <button 
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
          onClick={onClose}
          title="Cerrar (ESC)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {children}
      </div>
    </div>
  );
}