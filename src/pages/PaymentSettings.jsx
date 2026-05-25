import React, { useState, useEffect } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { API_BASE } from '../utils/config';
import toast from 'react-hot-toast';

const PaymentSettingsPage = () => {
  const [settings, setSettings] = useState({
    jazzcash_number: '',
    jazzcash_name: 'JazzCash',
    easypaisa_number: '',
    easypaisa_name: 'EasyPaisa',
    bank_account: '',
    bank_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/payment-settings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/payment-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment settings saved!');
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6B35] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Payment Settings</h1>
      <p className="text-gray-500 text-sm">Set JazzCash & EasyPaisa numbers for customer payments</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* JazzCash */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" /> JazzCash
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Title</label>
              <input
                type="text"
                value={settings.jazzcash_name}
                onChange={(e) => setSettings({ ...settings, jazzcash_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="JazzCash"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.jazzcash_number}
                onChange={(e) => setSettings({ ...settings, jazzcash_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none font-mono"
                placeholder="0300-1234567"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* EasyPaisa */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" /> EasyPaisa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Title</label>
              <input
                type="text"
                value={settings.easypaisa_name}
                onChange={(e) => setSettings({ ...settings, easypaisa_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="EasyPaisa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.easypaisa_number}
                onChange={(e) => setSettings({ ...settings, easypaisa_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none font-mono"
                placeholder="0300-7654321"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Bank Account */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Bank Account (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="HBL / Meezan Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
              <input
                type="text"
                value={settings.bank_account}
                onChange={(e) => setSettings({ ...settings, bank_account: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none font-mono"
                placeholder="PK00BANK0000001234567890"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <CreditCard size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">How it works</p>
          <p className="text-sm text-blue-600 mt-1">
            These numbers appear on the <strong>/landing</strong> page. Customers search their Payment ID, see these numbers, send payment, and upload a screenshot. You can verify and approve from the Subscriptions page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
