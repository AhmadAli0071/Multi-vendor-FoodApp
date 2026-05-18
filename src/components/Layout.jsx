import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Shield } from 'lucide-react';

const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || '123456';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_passcode');
    if (saved === PASSCODE) {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === PASSCODE) {
      localStorage.setItem('admin_passcode', code);
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid passcode');
      setCode('');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-500 mt-1">Enter 6-digit passcode</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <input
              type="password"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="000000"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-center text-2xl tracking-[0.5em] font-bold text-gray-800 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full mt-4 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF6B35] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#e55a2b] transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
};

export default Layout;
