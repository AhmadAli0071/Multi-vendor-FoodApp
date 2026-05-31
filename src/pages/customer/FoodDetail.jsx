import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { Minus, Plus, ShoppingCart, Clock, Flame, ChevronLeft, ArrowRight } from 'lucide-react';

const FoodDetail = () => {
  const { itemId } = useParams();
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, menu, addToCart, nav } = useCustomer();

  const allItems = menu.flatMap(m => m.items.map(item => ({ ...item, category: m.category, categoryIcon: m.category_icon })));
  const item = allItems.find(i => i.id === itemId);

  const [quantity, setQuantity] = useState(1);
  const [sliding, setSliding] = useState(false);
  const [slidePercent, setSlidePercent] = useState(0);
  const sliderRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSliding(true);
  };

  const handleTouchMove = (e) => {
    if (!sliding) return;
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.touches[0].clientX - startX.current;
    const pct = Math.min(100, Math.max(0, (dx / rect.width) * 100));
    setSlidePercent(pct);
  };

  const handleTouchEnd = () => {
    if (slidePercent > 80) {
      handleAddToCart();
    }
    setSliding(false);
    setSlidePercent(0);
  };

  const handleMouseDown = (e) => {
    startX.current = e.clientX;
    setSliding(true);
  };

  const handleMouseMove = (e) => {
    if (!sliding) return;
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - startX.current;
    const pct = Math.min(100, Math.max(0, (dx / rect.width) * 100));
    setSlidePercent(pct);
  };

  const handleMouseUp = () => {
    if (slidePercent > 80) {
      handleAddToCart();
    }
    setSliding(false);
    setSlidePercent(0);
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-3xl">🔍</span>
        </div>
        <p className="text-sm font-medium text-gray-500">Item not found</p>
        <button onClick={() => navigate(nav('/'))} className="mt-4 px-6 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-200">Back to Menu</button>
      </div>
    );
  }

  const primaryColor = restaurant?.primary_color || '#D81B60';

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(slug, item);
    }
    navigate(nav('/'));
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Back Button Overlay */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center"
      >
        <ChevronLeft size={18} className="text-gray-700" />
      </button>

      {/* Hero Image */}
      <div className="h-56 sm:h-72 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute bottom-0 left-5 w-32 h-32 rounded-full bg-white" />
        </div>
        {item.image && (item.image.startsWith('data:') || item.image.startsWith('http') || item.image.startsWith('/uploads')) ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover relative z-10" />
        ) : (
          <span className="text-[100px] relative z-10 drop-shadow-xl">{item.image || '🍽️'}</span>
        )}
        {item.popular && (
          <div className="absolute top-4 right-4 bg-white text-pink-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg z-10">
            <Flame size={12} /> Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-24 space-y-5 -mt-6 bg-white rounded-t-3xl relative">
        {/* Title & Price */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] bg-pink-50 text-pink-500 px-2.5 py-1 rounded-full font-semibold">{item.categoryIcon || '🍽️'} {item.category}</span>
            {item.prepTime && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Clock size={11} /> {item.prepTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mt-1">{item.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-extrabold" style={{ color: primaryColor }}>Rs. {item.price}</p>
            <span className="text-xs text-gray-400">per serving</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Description */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{item.description || 'Freshly prepared with quality ingredients. Our chefs take pride in every dish we serve.'}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Quantity Selector */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Quantity</h3>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-pink-300 active:scale-95 transition-all"
            >
              <Minus size={18} className="text-gray-500" />
            </button>
            <span className="text-xl font-bold text-gray-800 w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-lg mx-auto safe-bottom">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <p className="text-[11px] text-gray-400">{quantity} item{quantity > 1 ? 's' : ''}</p>
            <p className="text-lg font-extrabold" style={{ color: primaryColor }}>Rs. {item.price * quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Total</p>
            <p className="text-lg font-extrabold" style={{ color: primaryColor }}>Rs. {item.price * quantity}</p>
          </div>
        </div>
        <div
          ref={sliderRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-full h-14 rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
          style={{ backgroundColor: primaryColor + '20' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-2xl flex items-center justify-center transition-none"
            style={{ width: `${slidePercent}%`, backgroundColor: primaryColor, opacity: 0.3 }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-bold select-none" style={{ color: primaryColor }}>
            <ArrowRight size={16} />
            Slide to Add to Cart
          </div>
          <div
            className="absolute top-1 bottom-1 left-1 w-12 rounded-xl flex items-center justify-center shadow-lg transition-shadow"
            style={{
              backgroundColor: primaryColor,
              transform: `translateX(${slidePercent === 0 ? 0 : `calc(${slidePercent}% - 48px)`})`,
              transition: sliding ? 'none' : 'transform 0.3s ease',
            }}
          >
            <ShoppingCart size={18} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;
