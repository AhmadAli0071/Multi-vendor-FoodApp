import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag, Clock, DollarSign, UtensilsCrossed,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';

const OwnerDashboard = () => {
  const { stats, orders, restaurant, isOpen } = useOwner();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith('/owner') ? '/owner' : '';

  const formatPKR = (amount) => `PKR ${amount.toLocaleString()}`;

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      Accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      Preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      Ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      Delivered: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Store Status Banner */}
      {!isOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
          <div>
            <p className="text-red-800 font-medium text-sm">Store is closed</p>
            <p className="text-red-600 text-xs">Customers cannot place orders</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag size={16} className="text-blue-600" />
            </div>
            <p className="text-xs text-gray-500">Today</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats.todayOrders}</p>
          <p className="text-xs text-gray-400">orders</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock size={16} className="text-orange-600" />
            </div>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-400">orders</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
          <p className="text-lg font-bold text-gray-800 truncate">{formatPKR(stats.todayRevenue)}</p>
          <p className="text-xs text-gray-400">today</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <UtensilsCrossed size={16} className="text-purple-600" />
            </div>
            <p className="text-xs text-gray-500">Menu</p>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats.totalItems}</p>
          <p className="text-xs text-gray-400">items</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate(`${base}/menu`)} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:bg-orange-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            <span className="text-sm font-medium text-gray-700">Manage Menu</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button onClick={() => navigate(`${base}/orders`)} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:bg-orange-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-sm font-medium text-gray-700">View Orders</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
          <button onClick={() => navigate(`${base}/orders`)} className="text-xs text-[#FF6B35] font-medium">
            View All
          </button>
        </div>
        {recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => (
              <div key={order.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{formatTime(order.createdAt)} · {order.items?.length || 0} items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{formatPKR(order.total)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm text-gray-400">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
