import React, { useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ArrowLeft, Home } from 'lucide-react';
import { CustomerProvider, useCustomer } from '../context/CustomerContext';
import InstallPrompt from './InstallPrompt';
import { updateManifest } from '../utils/manifest';

const CustomerLayoutInner = ({ children }) => {
  const params = useParams();
  const location = useLocation();
  const { slug: contextSlug, restaurant, customer, logout, cartCount, cartTotal, loading, error, loadRestaurant } = useCustomer();
  const navigate = useNavigate();
  const slug = contextSlug || params.slug;

  const subdomainMode = !!contextSlug;

  const isHomePage = !subdomainMode
    ? location.pathname === `/r/${slug}`
    : location.pathname === '/';
  const isCheckout = location.pathname.includes('/checkout');
  const isTracking = location.pathname.includes('/order/');
  const isCart = location.pathname.includes('/cart');
  const isAccount = location.pathname.includes('/account');

  const p = (path) => subdomainMode ? path : `/r/${slug}${path}`;

  useEffect(() => {
    loadRestaurant(slug);
  }, [slug, loadRestaurant]);

  useEffect(() => {
    if (restaurant) {
      updateManifest({ name: restaurant.name, shortName: restaurant.name });
    }
  }, [restaurant]);

  const handleLogout = () => {
    logout();
    navigate(p('/'));
  };

  const primaryColor = restaurant?.primary_color || '#D81B60';

  if (loading) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-200 border-t-pink-500" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-white px-6">
        <div className="w-20 h-20 rounded-3xl bg-pink-50 flex items-center justify-center mb-4">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Not Found</h2>
        <p className="text-gray-500 text-center text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-white max-w-lg mx-auto relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-50 safe-top bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {!isHomePage && (
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 transition-colors">
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
            )}
            <Link to={p('/')} className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm" style={{ backgroundColor: primaryColor }}>
                {restaurant?.logo && (restaurant.logo.startsWith('data:') || restaurant.logo.startsWith('http') || restaurant.logo.startsWith('/uploads')) ? (
                  <img src={restaurant.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{restaurant?.logo || '🍔'}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-[13px] font-bold text-gray-800 leading-tight truncate max-w-[160px] sm:max-w-[220px]">{restaurant?.name || 'Menu'}</h1>
                <p className="text-[10px] text-gray-400 truncate max-w-[160px] sm:max-w-[220px]">{restaurant?.delivery_available ? 'Delivery & Pickup' : 'Pickup only'}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => navigate(p('/cart'))} className="relative p-2.5 rounded-full hover:bg-gray-50 transition-colors">
              <ShoppingCart size={20} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold shadow-sm" style={{ backgroundColor: primaryColor }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            {customer ? (
              <button onClick={handleLogout} className="p-2.5 rounded-full hover:bg-gray-50 transition-colors">
                <LogOut size={18} className="text-gray-400" />
              </button>
            ) : (
              <button onClick={() => navigate(p('/login'))} className="p-2.5 rounded-full hover:bg-gray-50 transition-colors">
                <User size={20} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>

      {/* Bottom Tab Navigation - Foodpanda Style */}
      {!isCheckout && !isTracking && !isCart && (
        <nav className="sticky bottom-0 z-40 safe-bottom bg-white border-t border-gray-100">
          <div className="flex items-center justify-around py-2">
            <Link
              to={p('/')}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
            >
              <Home size={22} className={isHomePage ? '' : 'text-gray-400'} style={isHomePage ? { color: primaryColor } : {}} />
              <span className={`text-[10px] font-semibold ${isHomePage ? '' : 'text-gray-400'}`} style={isHomePage ? { color: primaryColor } : {}}>Home</span>
            </Link>

            <Link
              to={p('/cart')}
              className="flex flex-col items-center gap-0.5 px-4 py-1 relative"
            >
              <ShoppingCart size={22} className="text-gray-400" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-2 text-white text-[9px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
              <span className="text-[10px] font-semibold text-gray-400">Cart</span>
            </Link>

            <Link
              to={p('/account')}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
            >
              <User size={22} className={isAccount ? '' : 'text-gray-400'} style={isAccount ? { color: primaryColor } : {}} />
              <span className={`text-[10px] font-semibold ${isAccount ? '' : 'text-gray-400'}`} style={isAccount ? { color: primaryColor } : {}}>Account</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Cart Bottom Bar - only on cart page */}
      {cartCount > 0 && isHomePage && !isCheckout && !isTracking && (
        <div className="sticky bottom-16 left-0 right-0 px-4 z-30">
          <button
            onClick={() => navigate(p('/cart'))}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-pink-200 active:scale-[0.98] transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold">{cartCount}</div>
              <span>View Cart</span>
            </div>
            <span className="text-white/90">Rs. {cartTotal}</span>
          </button>
        </div>
      )}

      <InstallPrompt />
    </div>
  );
};

const CustomerLayout = ({ children, slug }) => (
  <CustomerProvider slug={slug}>
    <CustomerLayoutInner>{children}</CustomerLayoutInner>
  </CustomerProvider>
);

export default CustomerLayout;
