import React, { useState, useEffect } from 'react';
import { Store, Palette, Truck, ShoppingBag, Save, ChevronRight, Upload, Image, X, Lock, Power, PowerOff, Trash2 } from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';
import { ownerApi } from '../../utils/ownerApi';
import { API_BASE } from '../../utils/config';
import toast from 'react-hot-toast';

const OwnerSettings = () => {
  const { restaurant, updateRestaurant, isOpen, toggleOpen, clearAllOrders } = useOwner();

  if (!restaurant) {
    return <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>;
  }

  // Map snake_case restaurant fields to camelCase form state
  const mapToForm = (r) => ({
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    whatsapp: r.whatsapp || '',
    address: r.address || '',
    primaryColor: r.primary_color || '#FF6B35',
    secondaryColor: r.secondary_color || '#FFFFFF',
    fontFamily: r.font_family || 'Poppins',
    logo: r.logo || '',
    deliveryAvailable: r.delivery_available !== false,
    pickupAvailable: r.pickup_available !== false,
    openingTime: r.opening_time || '09:00',
    closingTime: r.closing_time || '22:00',
    estimatedDeliveryTime: r.estimated_delivery_time || 30,
    minOrderAmount: r.min_order_amount || 0,
    plan: r.plan || 'Business'
  });

  const [form, setForm] = useState(mapToForm(restaurant));

  // Update form if restaurant changes (rare)
  useEffect(() => {
    setForm(mapToForm(restaurant));
  }, [restaurant]);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSave = (section) => {
    updateRestaurant(form);
    toast.success(`${section} saved!`);
  };

  const [showBrandPreview, setShowBrandPreview] = useState(false);

  // Payment Proof State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImageName, setPaymentImageName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentImage(reader.result);
      setPaymentImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!paymentImage) {
      toast.error('Select a screenshot');
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('foodapp_customer_token') || '';
      const res = await fetch(`${API_BASE}/payment-proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          image: paymentImage,
          plan: restaurant.plan
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Payment proof sent for approval!');
      setPaymentAmount('');
      setPaymentImage(null);
      setPaymentImageName('');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const primaryColor = form.primaryColor || '#FF6B35';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Settings</h1>
        <p className="text-xs text-gray-400">Manage your restaurant</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Store size={16} className="text-[#FF6B35]" /> Restaurant Profile
        </h2>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Restaurant Name" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
          <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="WhatsApp" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        </div>
        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
          placeholder="Address" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35] resize-none" />
        <button onClick={() => handleSave('Profile')}
          className="w-full py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <Save size={14} /> Save Profile
        </button>
      </div>

      {/* Payment ID */}
      {restaurant.payment_id && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
          <p className="text-xs text-purple-500 font-medium mb-1">Your Payment ID</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-purple-700 tracking-widest font-mono">{restaurant.payment_id}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(restaurant.payment_id); toast.success('Payment ID copied!'); }}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-purple-400 mt-2">Share this ID with your customers for subscription payments</p>
        </div>
      )}

      {/* Branding */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Palette size={16} className="text-[#FF6B35]" /> Branding
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Primary Color</label>
            <div className="flex gap-1">
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-10 h-9 rounded-lg border-0 cursor-pointer" />
              <input type="text" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none uppercase" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Secondary</label>
            <div className="flex gap-1">
              <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="w-10 h-9 rounded-lg border-0 cursor-pointer" />
              <input type="text" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none uppercase" />
            </div>
          </div>
        </div>
        <input type="text" value={form.logo && !form.logo.startsWith('data:image') && !form.logo.startsWith('http') && !form.logo.startsWith('/uploads') ? form.logo : ''} onChange={(e) => setForm({ ...form, logo: e.target.value })}
          placeholder="Logo (emoji)" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />

        <div className="flex items-center gap-3">
          <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50 transition-colors flex-1">
            <Upload size={16} className="text-gray-500" />
            <span className="text-xs text-gray-600">Upload Logo Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingLogo(true);
                try {
                  const url = await ownerApi.uploadImage(file);
                  setForm({ ...form, logo: url });
                  toast.success('Logo uploaded!');
                } catch (error) {
                  toast.error('Upload failed: ' + error.message);
                } finally {
                  setUploadingLogo(false);
                }
              }}
              className="hidden"
            />
          </label>
          {(form.logo && (form.logo.startsWith('data:image') || form.logo.startsWith('http') || form.logo.startsWith('/uploads'))) && (
            <button
              onClick={() => { setForm({ ...form, logo: '' }); updateRestaurant({ ...form, logo: '' }); toast.success('Logo removed'); }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={16} />
            </button>
          )}
          {uploadingLogo && <span className="text-xs text-gray-400">Uploading...</span>}
        </div>

        {/* Brand Preview Toggle */}
        <button onClick={() => setShowBrandPreview(!showBrandPreview)}
          className="w-full py-2 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-between px-3">
          <span>Preview</span>
          <ChevronRight size={14} className={`transition-transform ${showBrandPreview ? 'rotate-90' : ''}`} />
        </button>
        {showBrandPreview && (
          <div className="rounded-xl p-3 border-2" style={{ borderColor: primaryColor + '40', backgroundColor: primaryColor + '08' }}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg overflow-hidden" style={{ backgroundColor: primaryColor + '20' }}>
                {form.logo && (form.logo.startsWith('data:image') || form.logo.startsWith('http')) ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  form.logo || '🍔'
                )}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: primaryColor }}>{form.name || 'Restaurant'}</p>
                <p className="text-xs text-gray-400">{form.address || 'Address'}</p>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => handleSave('Branding')}
          className="w-full py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <Save size={14} /> Save Branding
        </button>
      </div>

      {/* Delivery & Hours */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Truck size={16} className="text-[#FF6B35]" /> Hours & Delivery
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Opens At</label>
            <input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Closes At</label>
            <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Delivery Time (mins)</label>
          <input type="number" value={form.estimatedDeliveryTime} onChange={(e) => setForm({ ...form, estimatedDeliveryTime: Number(e.target.value) })}
            min="15" max="120" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.deliveryAvailable !== false} onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })}
              className="w-4 h-4 accent-[#FF6B35]" />
            <span className="text-sm">Delivery</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.pickupAvailable !== false} onChange={(e) => setForm({ ...form, pickupAvailable: e.target.checked })}
              className="w-4 h-4 accent-[#FF6B35]" />
            <span className="text-sm">Pickup</span>
          </label>
        </div>
        <button onClick={() => handleSave('Delivery')}
          className="w-full py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <Save size={14} /> Save Settings
        </button>
      </div>

      {/* Order Settings */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag size={16} className="text-[#FF6B35]" /> Order Settings
        </h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Min Order (PKR)</label>
          <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
            min="0" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
        </div>
        <button onClick={() => handleSave('Order Settings')}
          className="w-full py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
          <Save size={14} /> Save Settings
        </button>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Lock size={16} className="text-[#FF6B35]" /> Actions
        </h2>
        <button
          onClick={() => { toggleOpen(); toast.success(isOpen ? 'Store locked' : 'Store opened'); }}
          className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
            isOpen ? 'bg-red-50 text-red-600 active:bg-red-100' : 'bg-green-50 text-green-600 active:bg-green-100'
          }`}
        >
          {isOpen ? <PowerOff size={14} /> : <Power size={14} />}
          {isOpen ? 'Lock Store (Stop Orders)' : 'Open Store'}
        </button>
        <button
          onClick={() => {
            if (window.confirm('Delete ALL orders permanently? This cannot be undone.')) {
              clearAllOrders();
              toast.success('All orders cleared');
            }
          }}
          className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-red-100"
        >
          <Trash2 size={14} /> Clear All Orders
        </button>
      </div>

      {/* Payment Proof Upload */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Upload size={16} className="text-[#FF6B35]" /> Upload Payment Proof
        </h2>
        <p className="text-xs text-gray-400">Screenshot ke saath amount upload karein. Admin approve karne ke baad subscription renew ho jayegi.</p>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount (PKR)</label>
          <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter amount paid" min="1"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35]" />
          {paymentAmount && (
            <p className="text-xs text-gray-400 mt-1">
              ~{Math.max(1, Math.floor(Number(paymentAmount) / ({ Starter: 2999, Business: 5999, Premium: 9999 }[restaurant.plan] || 5999)))} month(s)
            </p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Payment Screenshot</label>
          <input type="file" accept="image/*" capture="environment" onChange={handleImageSelect}
            className="hidden" id="payment-file" />
          <label htmlFor="payment-file"
            className="flex items-center justify-center gap-2 px-3 py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50/50 transition-colors">
            <Image size={20} className="text-gray-400" />
            <span className="text-xs text-gray-500">{paymentImageName || 'Tap to upload screenshot'}</span>
          </label>
          {paymentImage && (
            <div className="relative mt-2">
              <img src={paymentImage} alt="Preview" className="w-full rounded-xl border max-h-48 object-cover" />
              <button onClick={() => { setPaymentImage(null); setPaymentImageName(''); }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <button onClick={handleUploadPayment} disabled={uploading}
          className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 active:bg-green-700 disabled:opacity-50">
          <Upload size={14} />
          {uploading ? 'Uploading...' : 'Submit for Approval'}
        </button>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-4"></div>
    </div>
  );
};

export default OwnerSettings;
