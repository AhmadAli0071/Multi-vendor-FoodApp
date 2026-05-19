import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Store, Phone, MapPin, Calendar, CreditCard, Edit2, Save, X, ClipboardList, Trash2, QrCode, Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../context/AppContext';
import { APP_URL, API_BASE } from '../utils/config';
import toast from 'react-hot-toast';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRestaurantById, updateRestaurant, renewSubscription, deleteRestaurant, orders } = useAppContext();

  const restaurant = getRestaurantById(id);

  const [activeTab, setActiveTab] = useState('basic');
  const [editMode, setEditMode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    primaryColor: '#FF6B35',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Poppins',
    deliveryAvailable: true,
    pickupAvailable: true,
    plan: 'Business',
    subscriptionStart: '',
    subscriptionEnd: ''
  });

  // Initialize form data when restaurant loads
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone || '',
        whatsapp: restaurant.whatsapp || '',
        address: restaurant.address || '',
        primaryColor: restaurant.primaryColor,
        secondaryColor: restaurant.secondaryColor,
        fontFamily: restaurant.fontFamily,
        deliveryAvailable: restaurant.deliveryAvailable,
        pickupAvailable: restaurant.pickupAvailable,
        plan: restaurant.plan,
        subscriptionStart: restaurant.subscriptionStart,
        subscriptionEnd: restaurant.subscriptionEnd
      });
    }
  }, [restaurant]);

  const fetchPayments = useCallback(async () => {
    if (!restaurant) return;
    setLoadingPayments(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/subscriptions/${restaurant.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.subscription.payments || []);
      }
    } catch { /* silent */ }
    setLoadingPayments(false);
  }, [restaurant]);

  useEffect(() => {
    if (activeTab === 'subscription') fetchPayments();
  }, [activeTab, fetchPayments]);

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Restaurant Not Found</h3>
        <p className="text-gray-500 mb-4">The restaurant you're looking for doesn't exist.</p>
        <Link
          to="/restaurants"
          className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
        >
          Back to Restaurants
        </Link>
      </div>
    );
  }

  // Get restaurant-specific orders
  const restaurantOrders = orders.filter(order => order.restaurantId === restaurant.id);

  // Calculate subscription status
  const getSubscriptionInfo = () => {
    const today = new Date();
    const endDate = new Date(restaurant.subscriptionEnd);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'expired', daysLeft: 0, progress: 100 };
    } else {
      const startDate = new Date(restaurant.subscriptionStart);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const remainingDays = daysLeft;
      const progress = ((totalDays - remainingDays) / totalDays) * 100;
      return { status: 'active', daysLeft, progress: Math.min(progress, 100) };
    }
  };

  const subInfo = getSubscriptionInfo();

  const customerQrUrl = `${APP_URL}/r/${restaurant.slug}`;

  const handleSave = () => {
    updateRestaurant(id, formData);
    toast.success('Restaurant updated successfully!');
    setEditMode(false);
  };

  const handleRenew = (months) => {
    renewSubscription(id, months);
    toast.success(`Subscription renewed for ${months} month(s)!`);
  };

  const handleToggleActive = async () => {
    const newActive = !restaurant.active;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE}/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ active: newActive })
      });
      const data = await res.json();
      if (data.success) {
        updateRestaurant(id, { active: newActive });
        toast.success(newActive ? 'Subscription activated' : 'Subscription deactivated');
      }
    } catch { toast.error('Failed to update'); }
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Plan pricing
  const planPrices = {
    Starter: 2999,
    Business: 5999,
    Premium: 9999
  };

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Store },
    { id: 'menu', label: 'Menu', icon: Store },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'subscription', label: 'Subscription', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
            <p className="text-sm text-gray-500">{restaurant.email}</p>
          </div>
        </div>
        {editMode ? (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save</span>
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowQR(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
            >
              <QrCode size={18} />
              <span>QR</span>
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors flex items-center space-x-2"
            >
              <Edit2 size={18} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${restaurant.name}" permanently?`)) {
                  deleteRestaurant(id);
                  toast.success('Restaurant deleted');
                  navigate('/restaurants');
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={formData.fontFamily}
                      onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none bg-white"
                    >
                      <option value="Poppins">Poppins</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Noto Nastaliq Urdu">Noto Nastaliq Urdu</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.deliveryAvailable}
                        onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                        className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
                      />
                      <span className="text-gray-700">Delivery</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pickupAvailable}
                        onChange={(e) => setFormData({ ...formData, pickupAvailable: e.target.checked })}
                        className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
                      />
                      <span className="text-gray-700">Pickup</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <Store className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Restaurant Name</p>
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Phone className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{restaurant.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{restaurant.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Joined</p>
                        <p className="font-medium text-gray-900">{formatDate(restaurant.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="flex items-center space-x-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Primary:</span>
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: restaurant.primaryColor }}
                      ></div>
                      <span className="text-xs font-mono">{restaurant.primaryColor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Secondary:</span>
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: restaurant.secondaryColor }}
                      ></div>
                      <span className="text-xs font-mono">{restaurant.secondaryColor}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Font:</span>
                      <span className="text-sm font-medium">{restaurant.fontFamily}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍔</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Menu Items Yet</h3>
              <p className="text-gray-500 mb-4">This restaurant hasn't added any menu items.</p>
              <button className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors">
                Add First Item (Coming Soon)
              </button>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              {restaurantOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Items</th>
                        <th className="pb-3 font-medium">Total</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurantOrders.map((order) => {
                        const statusColors = {
                          pending: 'bg-yellow-100 text-yellow-800',
                          accepted: 'bg-blue-100 text-blue-800',
                          preparing: 'bg-orange-100 text-orange-800',
                          ready: 'bg-green-100 text-green-800',
                          delivered: 'bg-gray-100 text-gray-800'
                        };
                        return (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-4 text-sm font-medium text-gray-900">{order.id}</td>
                            <td className="py-4 text-sm text-gray-600">{order.customerName}</td>
                            <td className="py-4 text-sm text-gray-600">{order.items}</td>
                            <td className="py-4 text-sm font-medium text-gray-900">PKR {order.total.toLocaleString()}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Yet</h3>
                  <p className="text-gray-500">This restaurant hasn't received any orders.</p>
                </div>
              )}
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Plan Summary */}
              <div className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current Plan</p>
                    <h2 className="text-2xl font-bold mb-1">{restaurant.plan}</h2>
                    <p className="text-sm opacity-80">
                      {planPrices[restaurant.plan]?.toLocaleString()}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Days Remaining</p>
                    <p className="text-3xl font-bold">{subInfo.daysLeft}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${100 - subInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Plan Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date</span>
                      <span className="font-medium">{formatDate(restaurant.subscriptionStart)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date</span>
                      <span className="font-medium">{formatDate(restaurant.subscriptionEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Cost</span>
                      <span className="font-medium text-[#FF6B35]">
                        PKR {planPrices[restaurant.plan]?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">{restaurant.deliveryAvailable ? '✓ Enabled' : '✗ Disabled'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Pickup</span>
                      <span className="font-medium">{restaurant.pickupAvailable ? '✓ Enabled' : '✗ Disabled'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Status</span>
                      <button
                        onClick={handleToggleActive}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${restaurant.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {restaurant.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Recent Payments</h3>
                  {loadingPayments ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#FF6B35] border-t-transparent" />
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((p, i) => (
                        <div key={p.id || i} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.plan} - {new Date(p.payment_date).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.status === 'completed' ? 'Paid' : p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">No payments yet</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {subInfo.status === 'expired' ? (
                  <>
                    <button
                      onClick={() => handleRenew(1)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Renew 1 Month
                    </button>
                    <button
                      onClick={() => handleRenew(3)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Renew 3 Months
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleRenew(1)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Renew Subscription
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Upgrade Plan
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                      Change Plan
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div><h3 className="text-lg font-bold text-gray-800">{restaurant.name}</h3><p className="text-xs text-gray-500">Customer App QR</p></div>
              <button onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex justify-center mb-3">
              <QRCodeSVG value={customerQrUrl} size={200} level="M" />
            </div>
            <p className="text-xs text-center text-gray-500 mb-3 break-all">{customerQrUrl}</p>
            <div className="flex gap-2">
              <button onClick={() => { const s = document.querySelector('.detail-qr svg'); if (s) { const c = document.createElement('canvas'); const i = new Image(); i.onload = () => { c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i,0,0); const a = document.createElement('a'); a.download = `qr-${restaurant.slug}.png`; a.href = c.toDataURL(); a.click(); }; i.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(s)); } }} className="flex-1 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"><Download size={14} /> Download</button>
              <button onClick={() => setShowQR(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
      <div className="detail-qr hidden"><QRCodeSVG value={customerQrUrl} size={200} level="M" /></div>
    </div>
  );
};

export default RestaurantDetail;
