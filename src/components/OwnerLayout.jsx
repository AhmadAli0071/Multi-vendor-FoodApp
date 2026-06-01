import React, { useEffect } from 'react';
import { NavLink, useOutlet, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList,
  Settings, Power, PowerOff, LogOut, Copy
} from 'lucide-react';
import { useOwner } from '../context/OwnerContext';
import InstallPrompt from './InstallPrompt';
import NewOrderPopup from './NewOrderPopup';
import { updateManifest } from '../utils/manifest';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';

const OwnerLayout = () => {
  const { restaurant, isOpen, isLoggedIn, toggleOpen, logout, orders, pendingAlerts, dismissAlert } = useOwner();
  const outlet = useOutlet();
  const location = useLocation();

  const isDedicatedOwner = !location.pathname.startsWith('/owner');

  const base = isDedicatedOwner ? '' : '/owner';

  const pendingCount = orders.filter(o => {
    const isPending = o.status === 'pending' || o.status === 'Pending';
    if (!isPending) return false;
    const orderDate = new Date(o.createdAt || o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  if (!isLoggedIn || !restaurant) {
    return <Navigate to={`${base}/login`} replace />;
  }

  useEffect(() => {
    if (restaurant) {
      updateManifest({
        name: restaurant.name,
        shortName: restaurant.name
      });
    }
  }, [restaurant]);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { to: base || '/', icon: LayoutDashboard, label: 'Home' },
    { to: `${base}/menu`, icon: UtensilsCrossed, label: 'Menu' },
    { to: `${base}/orders`, icon: ClipboardList, label: 'Orders' },
    { to: `${base}/settings`, icon: Settings, label: 'Settings' }
  ];

  const linkClasses = ({ isActive }) =>
    `flex flex-col items-center justify-center py-1 px-2 transition-colors ${
      isActive ? 'text-[#FF6B35]' : 'text-gray-400'
    }`;

  return (
    <div className="h-dvh flex flex-col bg-gray-50 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
      {/* Top Header */}
      <header className="sticky top-0 z-50 safe-top bg-white/70 backdrop-blur-xl border-b border-gray-200/60">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
              {restaurant.logo && (restaurant.logo.startsWith('data:image') || restaurant.logo.startsWith('http')) ? (
                <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{restaurant.logo || '🍔'}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm leading-tight truncate max-w-[130px] sm:max-w-[180px] text-gray-900">{restaurant.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[11px] font-medium text-gray-500">{isOpen ? 'Open' : 'Closed'}</span>
                {restaurant.phone && (
                  <>
                    <span className="text-[10px] text-gray-300">|</span>
                    <span className="text-[10px] text-gray-400">{restaurant.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell pendingCount={pendingCount} navigateTo={`${base}/orders`} />
            <button
              onClick={toggleOpen}
              className={`p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isOpen
                  ? 'bg-gray-100 hover:bg-gray-200 text-green-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-red-500'
              }`}
              title={isOpen ? 'Close Store' : 'Open Store'}
            >
              {isOpen ? <Power size={17} /> : <PowerOff size={17} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-200 text-gray-500"
              title="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pb-24">
          {outlet}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200/80 safe-bottom max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === (base || '/')}
              className={linkClasses}
            >
              <item.icon size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <InstallPrompt />

      {pendingAlerts.map(alert => (
        <NewOrderPopup key={alert.orderId} alert={alert} onDismiss={dismissAlert} />
      ))}
    </div>
  );
};

export default OwnerLayout;
