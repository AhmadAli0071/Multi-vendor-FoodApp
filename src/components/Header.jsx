import React from 'react';
import { useLocation } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const routeTitles = {
      '/': 'Dashboard',
      '/add-restaurant': 'Add Restaurant',
      '/restaurants': 'All Restaurants',
      '/orders': 'All Orders',
      '/subscriptions': 'Subscriptions',
      '/payment-settings': 'Payment Settings',
      '/broadcast': 'Broadcast',
      '/settings': 'Settings'
    };
    if (location.pathname.startsWith('/restaurants/') && location.pathname !== '/restaurants') {
      return 'Restaurant Details';
    }
    return routeTitles[location.pathname] || 'FoodApp';
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.reload();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
          title="Lock Admin"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
