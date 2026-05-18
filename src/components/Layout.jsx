import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF6B35] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default Layout;
