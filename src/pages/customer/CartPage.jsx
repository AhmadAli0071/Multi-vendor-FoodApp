import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { Minus, Plus, Trash2, ShoppingBag, Sparkles, Clock, ChevronRight } from 'lucide-react';

const CartPage = () => {
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, cart, updateQuantity, removeFromCart, cartTotal, clearCart, nav } = useCustomer();
  const primaryColor = restaurant?.primary_color || '#D81B60';

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-24 h-24 rounded-3xl bg-pink-50 flex items-center justify-center mb-5 shadow-lg">
          <ShoppingBag size={44} className="text-pink-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-800 mb-1">Your Cart is Empty</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Add delicious items from the menu</p>
        <Link to={nav('/')} className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all" style={{ backgroundColor: primaryColor }}>
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Cart Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: primaryColor }} />
            My Cart
            <span className="text-sm font-medium text-gray-400">({cart.items.length} item{cart.items.length > 1 ? 's' : ''})</span>
          </h2>
          <button onClick={clearCart} className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="px-5 mb-3">
        <div className="bg-pink-50 rounded-2xl p-3 flex items-center gap-3 border border-pink-100">
          <Sparkles size={18} className="text-pink-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-pink-600 flex-1">Free delivery on orders above Rs. 500!</p>
          <ChevronRight size={14} className="text-pink-300 flex-shrink-0" />
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 space-y-2">
        {cart.items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-gray-100">
            {/* Image */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.image && (item.image.startsWith('data:') || item.image.startsWith('http') || item.image.startsWith('/uploads')) ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{item.image || '🍽️'}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Rs. {item.price} each</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-2 py-1.5">
              <button onClick={() => updateQuantity(item.id, -1)} className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform border border-gray-100">
                <Minus size={14} className="text-gray-600" />
              </button>
              <span className="w-5 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)} className="w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform" style={{ backgroundColor: primaryColor }}>
                <Plus size={14} />
              </button>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0 whitespace-nowrap min-w-[60px]">
              <p className="text-sm font-extrabold text-gray-800">Rs. {item.price * item.quantity}</p>
            </div>

            {/* Remove */}
            <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Bill Summary */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2.5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bill Details</h3>
          {cart.items.map(item => (
            <div key={item.id} className="flex justify-between text-xs text-gray-500">
              <span className="truncate flex-1 mr-2">{item.name} x {item.quantity}</span>
              <span className="flex-shrink-0">Rs. {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">Total</span>
            <span className="text-lg font-extrabold" style={{ color: primaryColor }}>Rs. {cartTotal}</span>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="px-5 mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>Estimated delivery: {restaurant?.estimated_delivery_time || '30-40'} minutes</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-lg mx-auto safe-bottom">
        <button
          onClick={() => navigate(nav('/checkout'))}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Proceed to Checkout</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">Rs. {cartTotal}</span>
        </button>
      </div>
    </div>
  );
};

export default CartPage;
