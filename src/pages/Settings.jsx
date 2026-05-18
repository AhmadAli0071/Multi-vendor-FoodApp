import React, { useState } from 'react';
import { User, Mail, Lock, Globe, DollarSign, Clock, Bell, Smartphone, AlertTriangle, Save, Trash2, Power, PowerOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { restaurants, orders, updateRestaurant } = useAppContext();

  const [adminProfile, setAdminProfile] = useState({
    name: 'Super Admin',
    email: 'admin@foodapp.pk',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [appSettings, setAppSettings] = useState({
    customerAppDomain: 'foodapp.pk',
    currency: 'PKR',
    timezone: 'Asia/Karachi'
  });

  const [notifications, setNotifications] = useState({
    subscriptionExpiryEmail: true,
    newRestaurantWhatsApp: true,
    dailyOrderSummary: false
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dashboardLocked, setDashboardLocked] = useState(localStorage.getItem('admin_locked') === 'true');

  const handleToggleLock = () => {
    const next = !dashboardLocked;
    setDashboardLocked(next);
    localStorage.setItem('admin_locked', next ? 'true' : 'false');
    toast.success(next ? 'Dashboard locked' : 'Dashboard unlocked');
  };

  const handleClearOrders = () => {
    if (window.confirm(`Delete ALL ${orders.length} orders permanently?`)) {
      localStorage.setItem('foodapp_orders', '[]');
      toast.success('All orders cleared. Refresh page.');
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!adminProfile.currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (!adminProfile.newPassword) {
      toast.error('Please enter new password');
      return;
    }
    if (adminProfile.newPassword !== adminProfile.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (adminProfile.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Mock password change
    toast.success('Password changed successfully!');
    setAdminProfile(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  // Handle settings save
  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  // Handle reset all data
  const handleResetData = () => {
    // In a real app, this would clear all data and reset to defaults
    toast.success('All data has been reset to defaults!');
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <Save size={18} />
          <span>Save All Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Admin Profile Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <User className="text-[#FF6B35] mr-2" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Admin Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={adminProfile.name}
                onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
              />
            </div>

            {/* Email (disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={adminProfile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Password Change */}
            <div className="md:col-span-2">
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <Lock className="text-gray-400 mr-2" size={20} />
                  <h3 className="text-md font-bold text-gray-800">Change Password</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={adminProfile.currentPassword}
                      onChange={(e) => setAdminProfile({ ...adminProfile, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={adminProfile.newPassword}
                      onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={adminProfile.confirmPassword}
                      onChange={(e) => setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePasswordChange}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* App Settings Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <Globe className="text-[#FF6B35] mr-2" size={24} />
            <h2 className="text-lg font-bold text-gray-800">App Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer App Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer App Domain
              </label>
              <input
                type="text"
                value={appSettings.customerAppDomain}
                onChange={(e) => setAppSettings({ ...appSettings, customerAppDomain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                placeholder="foodapp.pk"
              />
              <p className="text-xs text-gray-500 mt-1">Customer apps will be served from https://{appSettings.customerAppDomain}/{slug}</p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={appSettings.currency}
                onChange={(e) => setAppSettings({ ...appSettings, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none bg-white"
              >
                <option value="PKR">PKR (₨)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={appSettings.timezone}
                onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none bg-white"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <Bell className="text-[#FF6B35] mr-2" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            {/* Email alerts for expiring subscriptions */}
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notifications.subscriptionExpiryEmail}
                  onChange={(e) => setNotifications({ ...notifications, subscriptionExpiryEmail: e.target.checked })}
                  className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
                />
                <div>
                  <p className="font-medium text-gray-900">Email alerts for expiring subscriptions</p>
                  <p className="text-sm text-gray-500">Get notified when a restaurant's subscription is about to expire</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.subscriptionExpiryEmail ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications.subscriptionExpiryEmail ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </label>

            {/* WhatsApp alerts for new restaurants */}
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notifications.newRestaurantWhatsApp}
                  onChange={(e) => setNotifications({ ...notifications, newRestaurantWhatsApp: e.target.checked })}
                  className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
                />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp alerts for new restaurants</p>
                  <p className="text-sm text-gray-500">Receive WhatsApp notifications when a new restaurant signs up</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.newRestaurantWhatsApp ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications.newRestaurantWhatsApp ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </label>

            {/* Daily order summary email */}
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notifications.dailyOrderSummary}
                  onChange={(e) => setNotifications({ ...notifications, dailyOrderSummary: e.target.checked })}
                  className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
                />
                <div>
                  <p className="font-medium text-gray-900">Daily order summary email</p>
                  <p className="text-sm text-gray-500">Receive a daily email with order statistics and analytics</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications.dailyOrderSummary ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications.dailyOrderSummary ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <Lock className="text-[#FF6B35] mr-2" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Actions</h2>
          </div>
          <div className="space-y-3">
            <button onClick={handleToggleLock}
              className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                dashboardLocked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}>
              {dashboardLocked ? <PowerOff size={16} /> : <Power size={16} />}
              {dashboardLocked ? 'Unlock Dashboard' : 'Lock Dashboard'}
            </button>
            <button onClick={handleClearOrders}
              className="w-full py-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100">
              <Trash2 size={16} /> Clear All Orders ({orders.length})
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
          <div className="flex items-center mb-6">
            <AlertTriangle className="text-red-600 mr-2" size={24} />
            <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <p className="font-bold text-red-900">Reset All Data</p>
                <p className="text-sm text-red-700">
                  Permanently delete all restaurants, orders, and settings. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset All Data?</h2>
              <p className="text-gray-600">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• All {restaurants.length} restaurants</li>
                <li>• All {orders.length} orders</li>
                <li>• All settings and preferences</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
              ⚠ <strong>Warning:</strong> This action is irreversible. All data will be permanently lost.
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono text-red-600">RESET</span> to confirm
              </label>
              <input
                type="text"
                placeholder="RESET"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value === 'RESET') {
                    handleResetData();
                  }
                }}
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="text"]');
                  if (input && input.value === 'RESET') {
                    handleResetData();
                  } else {
                    toast.error('Please type RESET to confirm');
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
