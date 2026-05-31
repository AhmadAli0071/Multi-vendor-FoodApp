import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, ShoppingBag, ClipboardList, DollarSign, Clock, AlertTriangle, Package, X, CheckCircle, Ban, Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { API_BASE } from '../utils/config';
import StatCard from '../components/StatCard';
import toast from 'react-hot-toast';

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
    const endDate = new Date(r.subscriptionEnd);
    if (isNaN(endDate.getTime())) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today); sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return endDate >= today && endDate <= sevenDaysFromNow;
  });

  const expiredRestaurants = restaurants.filter(r => {
    if (!r.subscriptionEnd) return false;
    const endDate = new Date(r.subscriptionEnd);
    if (isNaN(endDate.getTime())) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return endDate < today;
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

  // Payment Proofs
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const t = localStorage.getItem('admin_token');
        const res = await fetch(`${API_BASE}/payment-proofs/pending`, { headers: { 'Authorization': `Bearer ${t}` } });
        const data = await res.json();
        if (data.success) setPaymentProofs(data.proofs);
      } catch (err) { /* */ }
    };
    fetchProofs();
  }, []);

  const handleApproveProof = async (proofId) => {
    try {
      const t = localStorage.getItem('admin_token');
      const r = await fetch(`${API_BASE}/payment-proofs/${proofId}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` } });
      const d = await r.json();
      if (d.success) { toast.success(d.message); setPaymentProofs(prev => prev.filter(p => p._id !== proofId)); } else throw new Error(d.message);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleRejectProof = async (proofId) => {
    try {
      const t = localStorage.getItem('admin_token');
      const r = await fetch(`${API_BASE}/payment-proofs/${proofId}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` }, body: JSON.stringify({ note: 'Rejected' }) });
      const d = await r.json();
      if (d.success) { toast.success('Rejected'); setPaymentProofs(prev => prev.filter(p => p._id !== proofId)); } else throw new Error(d.message);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    const base = API_BASE.replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const [imgErrors, setImgErrors] = useState({});

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

      {/* Pending Payment Proofs */}
      {paymentProofs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#FF6B35]" /> Pending Payment Proofs ({paymentProofs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentProofs.map(proof => (
              <div key={proof._id} className="border border-gray-200 rounded-xl p-4">
                <div className="mb-3">
                  <p className="font-bold text-gray-800">{proof.restaurant_name}</p>
                  <p className="text-sm text-gray-500">{proof.plan} Plan</p>
                  <p className="text-lg font-bold text-[#FF6B35] mt-1">PKR {proof.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">~{proof.months_to_add} month(s)</p>
                </div>
                {proof.image && !imgErrors[proof._id] && (
                  <img src={getImageUrl(proof.image)} alt="Payment proof" className="w-full rounded-lg border max-h-40 object-contain mb-3 cursor-pointer bg-gray-100" onClick={() => setPreviewImage(getImageUrl(proof.image))} onError={() => setImgErrors(p => ({ ...p, [proof._id]: true }))} />
                )}
                {proof.image && imgErrors[proof._id] && (
                  <div className="w-full rounded-lg border max-h-40 mb-3 bg-gray-100 flex items-center justify-center cursor-pointer" onClick={() => setPreviewImage(getImageUrl(proof.image))}>
                    <ImageIcon size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleApproveProof(proof._id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-green-700">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleRejectProof(proof._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-100">
                    <Ban size={16} /> Reject
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(proof.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <AlertTriangle className={expiringRestaurants.length > 0 || expiredRestaurants.length > 0 ? 'text-yellow-500' : 'text-gray-300'} size={20} />
          </div>
          <div className="p-4">
            {expiringRestaurants.length > 0 || expiredRestaurants.length > 0 ? (
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
                {expiredRestaurants.map(r => {
                  const daysOver = Math.abs(Math.ceil((new Date(r.subscriptionEnd) - new Date()) / 86400000));
                  return (
                    <div key={r.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{r.name}</h3>
                          <p className="text-xs text-red-500 mt-0.5">{daysOver} days overdue</p>
                        </div>
                        <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">Expired</span>
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X size={28} />
            </button>
            <img src={previewImage} alt="Payment proof full" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
