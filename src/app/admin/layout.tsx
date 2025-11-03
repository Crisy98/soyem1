'use client';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // No mostrar el Navbar en la página de login
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoginPage && <Navbar />}
      <main className={!isLoginPage ? "w-[95%] mx-auto py-6" : ""}>
        <div className={!isLoginPage ? "overflow-x-auto" : ""}>
          {children}
        </div>
      </main>
    </div>
  )
}