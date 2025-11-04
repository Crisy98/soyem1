'use client';
import { useEffect, useState } from 'react';
import MovimientosList from './MovimientosList';

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

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      const response = await fetch('/api/movimientos');
      if (!response.ok) {
        throw new Error('Error al cargar los movimientos');
      }
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Movimientos</h1>
      </div>
      <MovimientosList movimientos={movimientos} />
    </div>
  );
}