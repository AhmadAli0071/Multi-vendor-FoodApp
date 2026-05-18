import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  ClipboardList,
  CreditCard,
  Megaphone,
  Settings,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/restaurants', icon: Store, label: 'All Restaurants' },
    { path: '/add-restaurant', icon: PlusCircle, label: 'Add Restaurant' },
    { path: '/orders', icon: ClipboardList, label: 'All Orders' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/broadcast', icon: Megaphone, label: 'Broadcast' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#1a1a2e] text-white transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🍔</span>
            <span className="text-xl font-bold tracking-wider">FoodApp</span>
          </div>
        </div>

        {/* Close button (mobile) */}
        <button
          className="lg:hidden absolute top-4 right-4 text-white"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-[#FF6B35] text-white border-l-4 border-l-[#FF6B35]'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
