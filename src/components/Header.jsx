import React from 'react';
import { useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import NotificationBell from './NotificationBell';

const Header = () => {
  const location = useLocation();
  const { orders } = useAppContext();

  const pendingCount = orders.filter(o => {
    const isPending = o.status === 'pending' || o.status === 'Pending';
    if (!isPending) return false;
    const orderDate = new Date(o.createdAt || o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const getPageTitle = () => {
    const routeTitles = {
      '/': 'Dashboard',
      '/add-restaurant': 'Add Restaurant',
      '/restaurants': 'All Restaurants',
      '/orders': 'All Orders',
      '/subscriptions': 'Subscriptions',
      '/broadcast': 'Broadcast',
      '/settings': 'Settings'
    };
    if (location.pathname.startsWith('/restaurants/') && location.pathname !== '/restaurants') {
      return 'Restaurant Details';
    }
    return routeTitles[location.pathname] || 'FoodApp';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>

      <div className="flex items-center space-x-4">
        <NotificationBell pendingCount={pendingCount} navigateTo="/orders" />
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
