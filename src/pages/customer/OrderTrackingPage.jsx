import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { Clock, CheckCircle2, Loader2, MessageCircle, Phone, Package, MapPin, User } from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'Your order has been received' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing', icon: Loader2, desc: 'Freshly preparing your food' },
  { key: 'ready', label: 'Ready', icon: CheckCircle2, desc: 'Order is ready!' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Enjoy your meal!' }
];

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, socket, getOrder, nav } = useCustomer();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const primaryColor = restaurant?.primary_color || '#D81B60';

  useEffect(() => {
    loadOrder();
    if (socket && orderId) {
      socket.emit('join-order-room', orderId);
      const handler = (data) => { if (data.order) setOrder(data.order); };
      socket.on('order-status-update', handler);
      return () => {
        socket.off('order-status-update', handler);
        socket.emit('leave-order-room', orderId);
      };
    }
  }, [orderId, socket]);

  useEffect(() => {
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try { const data = await getOrder(orderId); setOrder(data); } catch (err) {}
    finally { setLoading(false); }
  };

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : 0;
  const whatsappLink = order?.restaurant_phone
    ? `https://wa.me/${order.restaurant_phone.replace(/[^0-9]/g, '')}?text=Hi%2C%20about%20order%20%23${orderId}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-3">
          <Package size={28} className="text-pink-300" />
        </div>
        <p className="text-sm text-gray-500 mb-4">Order not found</p>
        <button onClick={() => navigate(nav('/'))} className="px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg" style={{ backgroundColor: primaryColor }}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-28 space-y-3">
      {/* Order Status Card */}
      <div className="rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 -right-6 w-24 h-24 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative text-white">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-extrabold">Order #{order.id}</h2>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold capitalize">{order.status}</span>
          </div>
          <p className="text-white/70 text-xs">
            {order.status === 'delivered' ? 'Enjoy your meal! 🎉' :
             order.status === 'ready' ? 'Your order is ready for pickup!' :
             order.status === 'preparing' ? 'Your food is being prepared...' :
             order.status === 'accepted' ? 'Restaurant has accepted your order' :
             'Waiting for restaurant confirmation'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Order Progress</h3>
        <div className="space-y-0">
          {statusSteps.map((step, idx) => {
            const isComplete = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`} style={isComplete ? { backgroundColor: primaryColor } : {}}>
                    {isCurrent && order.status !== 'delivered' && order.status !== 'pending' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <StepIcon size={16} />
                    )}
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[24px] ${idx < currentStepIndex ? '' : 'bg-gray-200'}`}
                      style={idx < currentStepIndex ? { backgroundColor: primaryColor } : {}} />
                  )}
                </div>
                <div className={`pb-5 ${idx === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                  <p className={`text-sm font-semibold ${isComplete ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Package size={15} style={{ color: primaryColor }} />
          Order Details
        </h3>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p className="flex items-center gap-2"><User size={12} className="text-gray-400" /><strong>Customer:</strong> {order.customer_name}</p>
          <p className="flex items-center gap-2"><Phone size={12} className="text-gray-400" /><strong>Phone:</strong> {order.customer_phone}</p>
          <p className="flex items-center gap-2"><MapPin size={12} className="text-gray-400" /><strong>Type:</strong> {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</p>
          {order.address && <p className="flex items-center gap-2"><MapPin size={12} className="text-gray-400" /><strong>Address:</strong> {order.address}</p>}
          {order.notes && <p className="flex items-center gap-2"><span>📝</span><strong>Notes:</strong> {order.notes}</p>}
        </div>
        <div className="h-px bg-gray-100 my-3" />
        <h4 className="text-sm font-bold text-gray-800 mb-2">Items</h4>
        <div className="space-y-1.5">
          {Array.isArray(order.items) ? order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-gray-500">{item.quantity}x {item.name}</span>
              <span className="font-semibold text-gray-700">Rs. {item.price * item.quantity}</span>
            </div>
          )) : <p className="text-xs text-gray-500">{order.items}</p>}
          {Array.isArray(order.items) && (
            <>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-lg font-extrabold" style={{ color: primaryColor }}>Rs. {order.total}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Buttons */}
      {whatsappLink && (
        <div className="flex gap-2">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3.5 bg-green-500 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:bg-green-600 shadow-md">
            <MessageCircle size={16} /> WhatsApp
          </a>
          {order.restaurant_phone && (
            <a href={`tel:${order.restaurant_phone}`}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:bg-gray-200">
              <Phone size={16} /> Call
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
