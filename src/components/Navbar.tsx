'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Logo */}
              <Image 
                src="/logo.png" 
                alt="SOYEM Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Enlaces de navegación */}
              <Link
                href="/admin/comercio"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/admin/comercio'
                    ? 'border-green-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Comercios
              </Link>
              <Link
                href="/admin/afiliado"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/admin/afiliado'
                    ? 'border-green-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Afiliados
              </Link>
            </div>
          </div>
          
          {/* Sección derecha del navbar (opcional) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="text-sm text-gray-500">
                Administración
              </div>
            </div>
          </div>

          {/* Menú móvil */}
          <div className="flex items-center sm:hidden">
            <div className="space-y-1">
              <Link
                href="/admin/comercio"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/admin/comercio'
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Comercios
              </Link>
              <Link
                href="/admin/afiliado"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/admin/afiliado'
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Afiliados
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}