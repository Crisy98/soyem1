"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [escaneado, setEscaneado] = useState(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (!escaneado) {
            setEscaneado(true);
            setScanning(false);
            
            // Detener scanner inmediatamente
            try {
              await html5QrCode.stop();
              await html5QrCode.clear();
            } catch (err) {
              console.error("Error deteniendo scanner:", err);
            }
            
            // Llamar onScan después de detener
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Error de escaneo continuo, no hacer nada
        }
      );
      setScanning(true);
    } catch (err) {
      console.error("Error iniciando scanner:", err);
      alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error deteniendo scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Escanear QR</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            Apunta la cámara al código QR del comercio
          </p>
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
        </div>
        
        <button
          onClick={handleClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
