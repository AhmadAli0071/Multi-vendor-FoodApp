import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { MapPin, Phone, User, CheckCircle, ShoppingBag, ChevronRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, customer, cart, cartTotal, placeOrder, clearCart, nav } = useCustomer();

  const primaryColor = restaurant?.primary_color || '#D81B60';
  const [orderType, setOrderType] = useState(restaurant?.delivery_available ? 'delivery' : 'pickup');
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Fill name and phone');
    if (orderType === 'delivery' && !form.address.trim()) return toast.error('Enter delivery address');
    if (cart.items.length === 0) return toast.error('Cart is empty');

    setSubmitting(true);
    try {
      const result = await placeOrder({
        restaurant_id: restaurant.id,
        items: cart.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total: cartTotal, order_type: orderType,
        customer_name: form.name, customer_phone: form.phone,
        address: orderType === 'delivery' ? form.address : '',
        notes: form.notes, customer_id: customer?.id || null
      });
      clearCart();
      toast.success('Order placed!');
      navigate(nav(`/order/${result.order.id}`));
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurant || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-4xl mb-3">🛒</div>
        <p className="text-sm text-gray-500 mb-4">Nothing to checkout</p>
        <Link to={nav('/')} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg" style={{ backgroundColor: primaryColor }}>Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <form onSubmit={handleSubmit} className="px-4 pt-3 space-y-3">
        {/* Order Type Toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ShoppingBag size={15} style={{ color: primaryColor }} />
            Order Type
          </h2>
          <div className="flex gap-2">
            {restaurant.delivery_available && (
              <button type="button" onClick={() => setOrderType('delivery')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'delivery' ? 'text-white shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'
                }`}
                style={orderType === 'delivery' ? { backgroundColor: primaryColor } : {}}>
                <MapPin size={16} /> Delivery
              </button>
            )}
            {restaurant.pickup_available && (
              <button type="button" onClick={() => setOrderType('pickup')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'pickup' ? 'text-white shadow-lg' : 'bg-gray-50 text-gray-500 border border-gray-100'
                }`}
                style={orderType === 'pickup' ? { backgroundColor: primaryColor } : {}}>
                <CheckCircle size={16} /> Pickup
              </button>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <User size={15} style={{ color: primaryColor }} />
            Your Details
          </h2>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Full Name *" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300 transition-colors" required />
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone Number *" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300 transition-colors" required />
          {orderType === 'delivery' && (
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
              placeholder="Delivery Address *" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300 transition-colors resize-none" required />
          )}
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
            placeholder="Special instructions (optional)" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-pink-300 transition-colors resize-none" />
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.quantity}x {item.name}</span>
                <span className="font-semibold text-gray-700">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-lg font-extrabold" style={{ color: primaryColor }}>Rs. {cartTotal}</span>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 py-1">
          <Shield size={12} />
          <span>Your order details are secure</span>
        </div>

        {/* Place Order Button */}
        <button type="submit" disabled={submitting}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}>
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <CheckCircle size={20} />
          )}
          {submitting ? 'Placing Order...' : `Place Order • Rs. ${cartTotal}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
