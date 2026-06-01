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

  const primaryColor = restaurant.primary_color || restaurant.primaryColor || '#FF6B35';
  const primaryTextColor = restaurant.primary_text_color || '#FFFFFF';

  return (
    <div className="h-dvh flex flex-col bg-gray-50 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 safe-top"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
              {restaurant.logo && (restaurant.logo.startsWith('data:image') || restaurant.logo.startsWith('http')) ? (
                <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl drop-shadow-sm">{restaurant.logo || '🍔'}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base leading-tight truncate max-w-[130px] sm:max-w-[180px] drop-shadow-sm" style={{ color: primaryTextColor }}>{restaurant.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-300' : 'bg-red-300'}`} />
                <span className="text-[11px] font-semibold drop-shadow-sm" style={{ color: primaryTextColor }}>{isOpen ? 'Open' : 'Closed'}</span>
                {restaurant.phone && (
                  <>
                    <span className="text-[10px] opacity-50" style={{ color: primaryTextColor }}>|</span>
                    <span className="text-[10px] font-medium opacity-80 drop-shadow-sm" style={{ color: primaryTextColor }}>{restaurant.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell pendingCount={pendingCount} navigateTo={`${base}/orders`} />
            <button
              onClick={toggleOpen}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isOpen
                  ? 'bg-white/10 hover:bg-white/20 active:scale-95'
                  : 'bg-white/20 hover:bg-white/30 active:scale-95'
              }`}
              title={isOpen ? 'Close Store' : 'Open Store'}
            >
              {isOpen
                ? <Power size={17} className="text-green-300" />
                : <PowerOff size={17} className="text-red-300" />
              }
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all duration-200"
              title="Logout"
            >
              <LogOut size={17} style={{ color: primaryTextColor }} />
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
