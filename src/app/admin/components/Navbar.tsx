'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CambiarContrasenaModal from '@/components/CambiarContrasenaModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [mostrarCambiarContrasena, setMostrarCambiarContrasena] = useState(false);
  
  useEffect(() => {
    // Obtener información del usuario actual
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/user-info');
        const data = await res.json();
        if (res.ok && data.username) {
          setUserName(data.username);
        }
      } catch (error) {
        console.error('Error obteniendo info del usuario:', error);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  return (
    <nav className="bg-gray-800 mb-6">
      <div className="w-[95%] mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex space-x-4">
            <Link
              href="/admin/afiliado"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.includes('/admin/afiliado') 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Afiliados
            </Link>
            <Link
              href="/admin/comercio"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.includes('/admin/comercio')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Comercios
            </Link>
            <Link
              href="/admin/movimientos"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.includes('/admin/movimientos')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Movimientos
            </Link>
            <Link
              href="/admin/rubros"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.includes('/admin/rubros')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Rubros
            </Link>
            <Link
              href="/admin/topes"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.includes('/admin/topes')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Topes
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Nombre del usuario */}
            {userName && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-white">{userName}</span>
              </div>
            )}

            {/* Botón Cambiar Contraseña */}
            <button
              onClick={() => setMostrarCambiarContrasena(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Cambiar Contraseña
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-red-600 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      <CambiarContrasenaModal
        isOpen={mostrarCambiarContrasena}
        onClose={() => setMostrarCambiarContrasena(false)}
      />
    </nav>
  );
}