import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, QrCode, Power, Trash2, X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../context/AppContext';
import { APP_URL, DOMAIN, OWNER_URL, getCustomerAppUrl } from '../utils/config';
import toast from 'react-hot-toast';

const RestaurantCard = ({ restaurant }) => {
  const { orders, deleteRestaurant, updateRestaurant } = useAppContext();
  const [showQR, setShowQR] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Delete "${restaurant.name}" permanently? This will remove all orders and data.`)) {
      deleteRestaurant(restaurant.id);
      toast.success('Restaurant deleted');
    }
  };

  // Get today's orders count for this restaurant
  const getTodayOrdersCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter(order => {
      if (order.restaurantId !== restaurant.id) return false;
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  };

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    const today = new Date();
    const endDate = new Date(restaurant.subscriptionEnd);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (daysLeft <= 7) {
      return { status: 'expiring', label: `${daysLeft} days left`, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const status = getSubscriptionStatus();
  const todayOrders = getTodayOrdersCount();

  // Generate customer app URL
  const customerUrl = getCustomerAppUrl(restaurant.slug);
  const ownerUrl = OWNER_URL;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Header with logo and name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Logo placeholder - circular */}
          <div
            className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold overflow-hidden border-2"
            style={{ borderColor: restaurant.primaryColor }}
          >
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: restaurant.primaryColor }}>
                {restaurant.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
            <p className="text-sm text-gray-500">{restaurant.email}</p>
            {restaurant.paymentId && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono font-bold tracking-wider">
                {restaurant.paymentId}
              </span>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Plan and Orders Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Plan</p>
          <p className="font-medium text-gray-900">{restaurant.plan}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Expiry Date</p>
          <p className="font-medium text-gray-900">
            {new Date(restaurant.subscriptionEnd).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Today's Orders */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Today's Orders</span>
          <span className="text-xl font-bold text-gray-900">{todayOrders}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <a
            href={customerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Customer App"
          >
            <Eye size={18} />
          </a>
          <Link
            to={`/restaurants/${restaurant.id}`}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Restaurant"
          >
            <Pencil size={18} />
          </Link>
          <button
            onClick={() => setShowQR(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View QR Code"
          >
            <QrCode size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Restaurant"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {status.status === 'expired' ? (
          <Link
            to={`/subscriptions`}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
          >
            Renew Now
          </Link>
        ) : (
          <button
            onClick={() => updateRestaurant(restaurant.id, { active: !restaurant.active })}
            className={`p-2 rounded-lg transition-colors ${restaurant.active
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            title={restaurant.active ? 'Click to deactivate' : 'Click to activate'}
          >
            <Power size={18} />
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{restaurant.name}</h3>
                <p className="text-xs text-gray-500">{restaurant.plan} Plan</p>
              </div>
              <button onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Customer App QR</p>
                <div className="customer-qr-svg">
                  <QRCodeSVG value={customerUrl} size={140} level="M" />
                </div>
                <a href={customerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 break-all text-center mt-2 font-mono">{customerUrl}</a>
                <button
                  onClick={() => {
                    const s = document.querySelector('.customer-qr-svg svg');
                    if (!s) return;
                    const c = document.createElement('canvas');
                    const i = new Image();
                    i.onload = () => { c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i,0,0); const a = document.createElement('a'); a.download = `customer-qr-${restaurant.slug}.png`; a.href = c.toDataURL(); a.click(); };
                    i.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(s));
                  }}
                  className="mt-2 px-3 py-1 bg-[#FF6B35] text-white rounded-lg text-xs flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </button>
              </div>
              <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Owner Dashboard QR</p>
                <div className="owner-qr-svg">
                  <QRCodeSVG value={ownerUrl} size={140} level="M" />
                </div>
                <a href={ownerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 break-all text-center mt-2 font-mono">{ownerUrl}</a>
                <button
                  onClick={() => {
                    const s = document.querySelector('.owner-qr-svg svg');
                    if (!s) return;
                    const c = document.createElement('canvas');
                    const i = new Image();
                    i.onload = () => { c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i,0,0); const a = document.createElement('a'); a.download = `owner-qr-${restaurant.slug}.png`; a.href = c.toDataURL(); a.click(); };
                    i.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(s));
                  }}
                  className="mt-2 px-3 py-1 bg-[#FF6B35] text-white rounded-lg text-xs flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
            <button onClick={() => setShowQR(false)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantCard;
