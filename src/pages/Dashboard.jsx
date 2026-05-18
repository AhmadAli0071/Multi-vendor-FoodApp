import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store, ShoppingBag, ClipboardList, DollarSign, Clock, AlertTriangle, Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { restaurants, orders, stats } = useAppContext();

  const getRestaurantName = (order) => {
    if (order.restaurantName) return order.restaurantName;
    if (order.restaurant_name) return order.restaurant_name;
    const r = restaurants.find(r => r.id === (order.restaurantId || order.restaurant_id));
    return r ? r.name : 'Unknown';
  };

  const expiringRestaurants = restaurants.filter(r => {
    if (!r.active) return false;
    if (!r.subscriptionEnd) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today); sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const endDate = new Date(r.subscriptionEnd);
    return endDate >= today && endDate <= sevenDaysFromNow;
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .slice(0, 5);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getChartData = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = orders.filter(o => {
        const od = new Date(o.createdAt || o.created_at);
        if (isNaN(od.getTime())) return false;
        return od.toISOString().split('T')[0] === dateStr;
      }).length;
      days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), orders: count });
    }
    return days;
  };

  const chartData = getChartData();
  const totalChartOrders = chartData.reduce((s, d) => s + d.orders, 0);

  const formatPKR = (amount) => `PKR ${(amount || 0).toLocaleString()}`;

  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[s] || styles.pending}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Store} label="Total Restaurants" value={stats.totalRestaurants} color="blue" />
        <StatCard icon={ShoppingBag} label="Active Orders" value={stats.activeOrders} color="green" hasPulse />
        <StatCard icon={ClipboardList} label="Today's Orders" value={stats.todayOrders} color="orange" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={formatPKR(stats.monthlyRevenue)} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-[#FF6B35] hover:underline">View All</Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-sm text-gray-500 border-b"><th className="pb-3 px-6 font-medium">Order ID</th><th className="pb-3 px-6 font-medium">Restaurant</th><th className="pb-3 px-6 font-medium">Customer</th><th className="pb-3 px-6 font-medium">Amount</th><th className="pb-3 px-6 font-medium">Status</th><th className="pb-3 px-6 font-medium">Time</th></tr></thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-6 text-sm font-medium text-gray-900">{order.id}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{getRestaurantName(order)}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{order.customerName || order.customer_name}</td>
                      <td className="py-3 px-6 text-sm font-medium text-gray-900">{formatPKR(order.total)}</td>
                      <td className="py-3 px-6"><StatusBadge status={order.status} /></td>
                      <td className="py-3 px-6 text-sm text-gray-500">{formatTime(order.createdAt || order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Subscription Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Subscription Alerts</h2>
            <AlertTriangle className="text-yellow-500" size={20} />
          </div>
          <div className="p-4">
            {expiringRestaurants.length > 0 ? (
              <div className="space-y-2">
                {expiringRestaurants.map(r => {
                  const daysLeft = Math.ceil((new Date(r.subscriptionEnd) - new Date()) / 86400000);
                  return (
                    <div key={r.id} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{r.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{daysLeft} days left</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">Expiring</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-300 text-lg mb-1">✓</div>
                <p className="text-sm text-gray-500">All subscriptions active</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Orders Last 7 Days</h2>
          <span className="text-sm text-gray-500">{totalChartOrders} total</span>
        </div>
        {totalChartOrders > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} formatter={(value) => [`${value} orders`, '']} />
                <Bar dataKey="orders" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Clock size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No orders in last 7 days</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
