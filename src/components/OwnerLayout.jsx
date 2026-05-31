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

  // Detect if on dedicated owner service (path is / not /owner)
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

  return (
    <div className="h-dvh flex flex-col bg-gray-100 max-w-lg mx-auto relative overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 text-white safe-top"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-lg overflow-hidden">
            {restaurant.logo && (restaurant.logo.startsWith('data:image') || restaurant.logo.startsWith('http')) ? (
              <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              restaurant.logo || '🍔'
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate max-w-[160px] sm:max-w-[220px]">{restaurant.name}</h1>
            <div className="flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-300' : 'bg-red-300'}`}></span>
              <span className="text-[10px] opacity-80">{isOpen ? 'Open' : 'Closed'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell pendingCount={pendingCount} navigateTo={`${base}/orders`} />
          <button
            onClick={toggleOpen}
            className={`p-2 rounded-lg transition-colors ${isOpen ? 'hover:bg-white/10' : 'bg-white/20 hover:bg-white/30'}`}
            title={isOpen ? 'Close Store' : 'Open Store'}
          >
            {isOpen ? <Power size={18} /> : <PowerOff size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Payment ID Banner */}
        {restaurant.payment_id && (
          <div className="mx-4 mt-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] text-amber-600 font-medium">Payment ID</p>
              <p className="text-xs font-bold text-amber-800 tracking-widest font-mono truncate">{restaurant.payment_id}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(restaurant.payment_id); toast.success('Copied!'); }}
              className="flex-shrink-0 ml-2 p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
        <div className="p-4 pb-24">
          {outlet}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom max-w-lg mx-auto">
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

      {/* New Order Popup Alerts */}
      {pendingAlerts.map(alert => (
        <NewOrderPopup key={alert.orderId} alert={alert} onDismiss={dismissAlert} />
      ))}
    </div>
  );
};

export default OwnerLayout;
