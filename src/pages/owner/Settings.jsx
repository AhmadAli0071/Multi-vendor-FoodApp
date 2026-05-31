import React, { useState, useEffect } from 'react';
import { Store, Palette, Truck, ShoppingBag, Save, ChevronRight, Upload, X, Lock, Power, PowerOff, Trash2, QrCode, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useOwner } from '../../context/OwnerContext';
import { ownerApi } from '../../utils/ownerApi';
import { APP_URL, DOMAIN, OWNER_URL } from '../../utils/config';
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
          <p className="text-xs text-purple-400 mt-2">Use this ID on the landing page to make subscription payments</p>
        </div>
      )}

      {/* Owner QR Code */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <QrCode size={16} className="text-[#FF6B35]" /> Owner Panel QR
        </h2>
        <p className="text-xs text-gray-500">Scan to open your owner dashboard</p>
        <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
          <QRCodeSVG
            value={OWNER_URL}
            size={180}
            level="M"
          />
        </div>
        <div className="text-center">
          <a
            href={OWNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 break-all font-mono"
          >
            {OWNER_URL}
          </a>
        </div>
        <button
          onClick={() => {
            const svg = document.querySelector('.owner-qr-svg svg');
            if (svg) {
              const c = document.createElement('canvas');
              const i = new Image();
              i.onload = () => {
                c.width = i.width; c.height = i.height;
                c.getContext('2d').drawImage(i, 0, 0);
                const a = document.createElement('a');
                a.download = `owner-qr-${restaurant.slug || 'panel'}.png`;
                a.href = c.toDataURL(); a.click();
              };
              i.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
            }
          }}
          className="w-full py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Download size={14} /> Download QR
        </button>
        <div className="owner-qr-svg hidden">
          <QRCodeSVG value={OWNER_URL} size={200} level="M" />
        </div>
      </div>

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

      {/* Spacer for bottom nav */}
      <div className="h-4"></div>
    </div>
  );
};

export default OwnerSettings;
