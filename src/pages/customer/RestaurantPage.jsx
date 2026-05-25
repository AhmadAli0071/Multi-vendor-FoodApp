import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerSlug } from '../../context/CustomerContext';
import { Search, Plus, Star, Clock, MapPin, Phone, Flame, Sparkles, ChevronRight, Tag } from 'lucide-react';

const RestaurantPage = () => {
  const slug = useCustomerSlug();
  const navigate = useNavigate();
  const { restaurant, menu, loading, error, addToCart, cartCount, cartTotal, nav } = useCustomer();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-pink-200 border-t-pink-500" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-3xl bg-pink-50 flex items-center justify-center mb-4">
          <span className="text-4xl">🔍</span>
        </div>
        <p className="text-gray-500 text-sm text-center">{error || 'Restaurant not found'}</p>
      </div>
    );
  }

  const categories = menu.length > 0 ? ['all', ...menu.map(m => m.category)] : [];
  const allItems = menu.flatMap(m => m.items.map(item => ({ ...item, category: m.category, categoryIcon: m.category_icon })));

  const filteredItems = allItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  const popularItems = allItems.filter(i => i.popular).slice(0, 5);
  const primaryColor = restaurant.primary_color || '#D81B60';
  const deliveryTime = restaurant.estimated_delivery_time || '30-40';
  const whatsappLink = restaurant.whatsapp ? `https://wa.me/${restaurant.whatsapp.replace(/^92/, '')}` : null;

  return (
    <div className="pb-20">
      {/* Hero Banner - Foodpanda Style */}
      <div className="relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 -right-4 w-32 h-32 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white opacity-50" />
        </div>
        <div className="relative px-4 py-6 text-white">
          {/* Restaurant Info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
              <span className="text-2xl">{restaurant.logo && restaurant.logo.length < 5 ? restaurant.logo : '🍔'}</span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-lg font-extrabold leading-tight">{restaurant.name}</h1>
              <p className="text-white/70 text-[11px] mt-0.5 line-clamp-1">{restaurant.address}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] font-semibold">4.5</span>
                <span className="text-white/50 text-[11px]">•</span>
                <span className="text-[11px]">{deliveryTime} min</span>
                {restaurant.delivery_available && (
                  <>
                    <span className="text-white/50 text-[11px]">•</span>
                    <span className="text-[11px]">Free delivery</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {restaurant.delivery_available && (
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300" /> Delivery
              </span>
            )}
            {restaurant.pickup_available && (
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium">Pickup</span>
            )}
            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium">{restaurant.plan || 'Standard'}</span>
            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
              <Tag size={9} /> 20% OFF
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-white rounded-t-2xl" />
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-2.5 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg shadow-pink-100/30 border border-gray-100 flex items-center px-4 py-2.5">
          <Search size={17} className="text-gray-400 flex-shrink-0" />
          <input
            type="text" placeholder="Search dishes, burgers, pizzas..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1 outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 active:bg-gray-200">Clear</button>
          )}
        </div>
      </div>

      {/* Free Delivery Banner */}
      {!search && activeCategory === 'all' && (
        <div className="px-4 mt-4">
          <div className="bg-pink-50 rounded-2xl p-3.5 flex items-center gap-3 border border-pink-100">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Tag size={18} className="text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Free Delivery on orders above Rs. 500</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Order now and save delivery charges</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Popular Picks - Horizontal Scroll */}
      {popularItems.length > 0 && !search && activeCategory === 'all' && (
        <div className="mt-5">
          <div className="px-4 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} style={{ color: primaryColor }} />
              <h3 className="text-sm font-bold text-gray-800">Popular Picks</h3>
            </div>
            <span className="text-[10px] font-semibold text-gray-400">See all</span>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {popularItems.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(nav(`/item/${item.id}`))}
                className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                <div className="h-24 bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center relative">
                  <span className="text-4xl">{item.image || '🍽️'}</span>
                  <span className="absolute top-2 left-2 bg-white text-pink-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">BEST</span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-bold text-gray-800">Rs. {item.price}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(slug, item); }}
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center active:scale-90 transition-transform shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories - Horizontal Pill Scroll */}
      {categories.length > 1 && (
        <div className="px-4 mt-2 sticky top-[60px] z-30 bg-white/90 backdrop-blur-lg py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeCategory === cat
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={activeCategory === cat ? { backgroundColor: primaryColor } : {}}
              >
                {cat === 'all' ? '🍽️ All' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="px-4 mt-4 mb-2">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Sparkles size={14} style={{ color: primaryColor }} />
          {activeCategory === 'all' ? 'Full Menu' : activeCategory}
        </h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{filteredItems.length} items available</p>
      </div>

      {/* Menu Items List - Foodpanda Card Style */}
      <div className="px-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No items found</p>
            <p className="text-[11px] text-gray-400 mt-1">Try a different search or category</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => navigate(nav(`/item/${item.id}`))}
              className="group bg-white rounded-2xl p-3 flex items-center gap-3.5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-pink-100 transition-all active:scale-[0.99]"
            >
              {/* Image */}
              <div className="w-18 h-18 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm relative" style={{ width: '64px', height: '64px' }}>
                <span className="text-3xl">{item.image || '🍽️'}</span>
                {item.popular && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">★</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                  {item.popular && (
                    <span className="flex-shrink-0 bg-pink-50 text-pink-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.description || 'Fresh & delicious'}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-sm font-extrabold text-gray-800">Rs. {item.price}</p>
                  {item.prepTime && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {item.prepTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(slug, item); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-all shadow-md"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                <Plus size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Restaurant Info Footer */}
      <div className="px-4 mt-6 mb-4">
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Restaurant Info</h3>
          {restaurant.address && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
              <span>{restaurant.address}</span>
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span>{restaurant.phone}</span>
            </div>
          )}
          {restaurant.opening_time && restaurant.closing_time && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <Clock size={13} className="text-gray-400 flex-shrink-0" />
              <span>{restaurant.opening_time} - {restaurant.closing_time}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantPage;
