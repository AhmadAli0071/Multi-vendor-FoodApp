import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { Mail, Phone, Clock, Package, ShoppingBag, ChevronRight, MapPin } from 'lucide-react';

const AccountPage = () => {
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, customer, getOrderHistory, nav } = useCustomer();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = restaurant?.primary_color || '#D81B60';

  useEffect(() => {
    if (!customer) { navigate(nav('/login')); return; }
    loadHistory();
  }, [customer]);

  const loadHistory = async () => {
    setLoading(true);
    try { const data = await getOrderHistory(); setOrders(data); } catch (err) {}
    finally { setLoading(false); }
  };

  if (!customer) return null;

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    accepted: 'bg-blue-50 text-blue-600 border-blue-100',
    preparing: 'bg-pink-50 text-pink-600 border-pink-100',
    ready: 'bg-green-50 text-green-600 border-green-100',
    delivered: 'bg-gray-50 text-gray-500 border-gray-100'
  };

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Profile Card */}
      <div className="rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 -right-6 w-24 h-24 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold flex-shrink-0 border border-white/10">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-white text-base truncate">{customer.name}</h2>
            <p className="text-white/70 text-[11px] flex items-center gap-1.5 mt-0.5"><Mail size={11} /> {customer.email}</p>
            <p className="text-white/70 text-[11px] flex items-center gap-1.5"><Phone size={11} /> {customer.phone}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Link to={nav('/')} className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: primaryColor }} />
            <span className="text-sm font-semibold text-gray-700">Browse Menu</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
        <Link to={nav('/cart')} className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50">
          <div className="flex items-center gap-3">
            <Package size={18} style={{ color: primaryColor }} />
            <span className="text-sm font-semibold text-gray-700">View Cart</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      {/* Order History */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Package size={16} style={{ color: primaryColor }} />
          Order History
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-3">No orders yet</p>
            <Link to={nav('/')} className="inline-block px-6 py-2.5 text-white rounded-2xl text-sm font-bold shadow-lg" style={{ backgroundColor: primaryColor }}>Start Ordering</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <Link key={order.id} to={nav(`/order/${order.id}`)}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400">#{order.id}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize border ${statusColors[order.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{order.restaurant_name || restaurant?.name}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {order.order_type && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold" style={{ color: primaryColor }}>Rs. {order.total}</span>
                    <ChevronRight size={14} className="text-gray-300 mt-1 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
