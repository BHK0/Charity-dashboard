'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, ChevronUp, LogOut, Users } from 'lucide-react';
import { 
  Building2, 
  BarChart3,
  Trees,
  X
} from 'lucide-react';

export default function Sidebar({ onSignOut, isOpen, onClose, isMobile }) {
  const pathname = usePathname();
  const [orgExpanded, setOrgExpanded] = useState(true);
  const [farmsExpanded, setFarmsExpanded] = useState(false);

  const isActive = (path) => pathname === path;

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div className={`
      fixed top-0 left-0 h-screen bg-white shadow-lg z-40
      transition-transform duration-300 ease-in-out
      w-64 transform
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      flex flex-col
    `}>
      {/* Close button for mobile */}
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      )}

      {/* Logo Section */}
      <div className="p-4 border-b">
        <Image 
          width={367}
          height={127}
          src="/logo.png" 
          alt="Logo" 
          className="h-8 w-auto mx-auto"
          priority
        />
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Organizations Management Section */}
        <div className="mb-4">
          <button
            onClick={() => setOrgExpanded(!orgExpanded)}
            className="w-full flex items-center justify-between p-2 text-[#998966] hover:bg-[#f8f7f8] rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Building2 size={20} />
              <span>Organizations</span>
            </div>
            {orgExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {orgExpanded && (
            <div className="ml-4 mt-2 space-y-2">
              <Link
                href="/admin"
                prefetch={true}
                onClick={handleLinkClick}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isActive('/admin') ? 'bg-[#998966] text-white' : 'text-gray-600 hover:bg-[#f8f7f8]'
                }`}
              >
                <Building2 size={18} />
                <span>Organizations</span>
              </Link>
              <Link
                href="/admin/analytics"
                prefetch={true}
                onClick={handleLinkClick}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isActive('/admin/analytics') ? 'bg-[#998966] text-white' : 'text-gray-600 hover:bg-[#f8f7f8]'
                }`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </Link>
            </div>
          )}
        </div>

        {/* Farms Management Section */}
        <div className="mb-4">
          <button
            onClick={() => setFarmsExpanded(!farmsExpanded)}
            className="w-full flex items-center justify-between p-2 text-[#998966] hover:bg-[#f8f7f8] rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Trees size={20} />
              <span>Farmers Management</span>
            </div>
            {farmsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {farmsExpanded && (
            <div className="ml-4 mt-2 space-y-2">
              <Link
                href="/admin/farmers"
                prefetch={true}
                onClick={handleLinkClick}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isActive('/admin/farmers') ? 'bg-[#998966] text-white' : 'text-gray-600 hover:bg-[#f8f7f8]'
                }`}
              >
                <Trees size={18} />
                <span>Farmers</span>
              </Link>
              <Link
                href="/admin/farmers/analytics"
                prefetch={true}
                onClick={handleLinkClick}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isActive('/admin/farmers/analytics') ? 'bg-[#998966] text-white' : 'text-gray-600 hover:bg-[#f8f7f8]'
                }`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t space-y-2 bg-white">
        <Link
          href="/admin/users"
          prefetch={true}
          onClick={handleLinkClick}
          className="flex items-center space-x-2 p-2 text-[#998966] hover:bg-[#f8f7f8] rounded-lg w-full transition-colors"
        >
          <Users size={20} />
          <span>User Management</span>
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center space-x-2 p-2 text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}