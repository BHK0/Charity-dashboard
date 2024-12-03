'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './_components/Sidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      setSidebarOpen(!isMobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignOut = () => {
    document.cookie = 'token=; path=/; max-age=0;';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f7f8]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={24} className="text-[#998966]" />
      </button>

      {/* Backdrop for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        onSignOut={handleSignOut} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      } p-4 lg:p-8 pt-16 lg:pt-8`}>
        {children}
      </main>
    </div>
  );
}
