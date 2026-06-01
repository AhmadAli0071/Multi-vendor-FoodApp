import React, { useState, useEffect } from 'react';
import { Store, Palette, ShoppingBag, Save, Upload, X, Lock, Power, PowerOff, Trash2, QrCode, Download, Phone, MapPin, Clock, Copy, Eye, EyeOff, Type, ChevronDown, ChevronRight } from 'lucide-react';
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

  const mapToForm = (r) => ({
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    whatsapp: r.whatsapp || '',
    address: r.address || '',
    primaryColor: r.primary_color || '#FF6B35',
    secondaryColor: r.secondary_color || '#FFFFFF',
    primaryTextColor: r.primary_text_color || '#FFFFFF',
    secondaryTextColor: r.secondary_text_color || '#374151',
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
  const [openSections, setOpenSections] = useState({ profile: true, branding: false, hours: false, orders: false, qr: false, actions: false });

  useEffect(() => {
    setForm(mapToForm(restaurant));
  }, [restaurant]);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showBrandPreview, setShowBrandPreview] = useState(false);

  const handleSaveAll = () => {
    updateRestaurant(form);
    toast.success('All settings saved!');
  };

  const primaryColor = form.primaryColor || '#FF6B35';
  const primaryTextColor = form.primaryTextColor || '#FFFFFF';
  const secondaryColor = form.secondaryColor || '#FFFFFF';
  const secondaryTextColor = form.secondaryTextColor || '#374151';

  const customerUrl = (() => {
    if (DOMAIN && restaurant.slug) return `https://${restaurant.slug}.${DOMAIN}`;
    const base = import.meta.env.VITE_CUSTOMER_URL || APP_URL;
    return restaurant.slug ? `${base}/r/${restaurant.slug}` : base;
  })();

  const downloadQr = (svgSelector, filename) => {
    const svgEl = document.querySelector(svgSelector);
    if (!svgEl) return;
    const svg = svgEl.querySelector('svg');
    if (!svg) return;
    const c = document.createElement('canvas');
    const i = new Image();
    i.onload = () => {
      c.width = i.width; c.height = i.height;
      c.getContext('2d').drawImage(i, 0, 0);
      const a = document.createElement('a');
      a.download = filename;
      a.href = c.toDataURL(); a.click();
    };
    i.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
  };

  const inputClasses = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:bg-white focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100";
  const labelClasses = "text-xs font-medium text-gray-500 mb-1.5 block";

  const SectionToggle = ({ icon: Icon, title, section }) => (
    <button
      onClick={() => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))}
      className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50/50 transition-colors border-b border-gray-100"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <Icon size={16} className="text-[#FF6B35]" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      <div className={`transition-transform duration-200 ${openSections[section] ? 'rotate-180' : ''}`}>
        <ChevronDown size={18} className="text-gray-400" />
      </div>
    </button>
  );

  const ColorField = ({ label, value, onChange, textColor, onTextColorChange }) => (
    <div className="space-y-2">
      <label className={labelClasses}>{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border-0 cursor-pointer p-0.5 flex-shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none uppercase font-mono focus:bg-white focus:border-[#FF6B35]" />
      </div>
      <div className="flex gap-2 items-center">
        <Type size={14} className="text-gray-400 flex-shrink-0" />
        <input type="color" value={textColor} onChange={(e) => onTextColorChange(e.target.value)}
          className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0.5 flex-shrink-0" />
        <input type="text" value={textColor} onChange={(e) => onTextColorChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] outline-none uppercase font-mono focus:bg-white focus:border-[#FF6B35]" />
        <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">Text</span>
      </div>
    </div>
  );

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your restaurant</p>
        </div>
      </div>

      {/* Single Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* === Profile === */}
        <SectionToggle icon={Store} title="Restaurant Profile" section="profile" />
        {openSections.profile && (
          <div className="px-5 py-4 space-y-4 border-b border-gray-50">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Restaurant Name" className={inputClasses} />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email" className={inputClasses} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone" className={`${inputClasses} pl-8`} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">WA</span>
                <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="WhatsApp" className={`${inputClasses} pl-9`} />
              </div>
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
                placeholder="Address" className={`${inputClasses} pl-8 resize-none`} />
            </div>
            {restaurant.payment_id && (
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl px-4 py-3 border border-purple-100">
                <div>
                  <p className="text-[10px] text-purple-500 font-medium">Payment ID</p>
                  <p className="text-sm font-bold text-purple-700 tracking-widest font-mono">{restaurant.payment_id}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(restaurant.payment_id); toast.success('Copied!'); }}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1">
                  <Copy size={12} /> Copy
                </button>
              </div>
            )}
          </div>
        )}

        {/* === Branding === */}
        <SectionToggle icon={Palette} title="Branding" section="branding" />
        {openSections.branding && (
          <div className="px-5 py-4 space-y-4 border-b border-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorField
                label="Primary Color"
                value={form.primaryColor}
                onChange={(val) => setForm({ ...form, primaryColor: val })}
                textColor={form.primaryTextColor}
                onTextColorChange={(val) => setForm({ ...form, primaryTextColor: val })}
              />
              <ColorField
                label="Secondary Color"
                value={form.secondaryColor}
                onChange={(val) => setForm({ ...form, secondaryColor: val })}
                textColor={form.secondaryTextColor}
                onTextColorChange={(val) => setForm({ ...form, secondaryTextColor: val })}
              />
            </div>

            <div>
              <label className={labelClasses}>Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 overflow-hidden flex-shrink-0">
                  {form.logo && (form.logo.startsWith('data:') || form.logo.startsWith('http') || form.logo.startsWith('/uploads')) ? (
                    <img src={form.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{form.logo || '🍽️'}</span>
                  )}
                </div>
                <label className="flex-1 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5">
                  <Upload size={14} /> {form.logo ? 'Change' : 'Upload'} Image
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setUploadingLogo(true);
                    try { const url = await ownerApi.uploadImage(f); setForm({ ...form, logo: url }); toast.success('Logo uploaded!'); }
                    catch (err) { toast.error('Upload failed'); }
                    finally { setUploadingLogo(false); }
                  }} />
                </label>
                {form.logo && (
                  <button onClick={() => { const f = { ...form, logo: '' }; setForm(f); updateRestaurant(f); toast.success('Logo removed'); }}
                    className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                )}
              </div>
              {!form.logo && <input type="text" value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="Or type an emoji (e.g. 🍕)" className={`${inputClasses} mt-2`} />}
              {uploadingLogo && <p className="text-xs text-gray-400 mt-1.5">Uploading...</p>}
            </div>

            <button onClick={() => setShowBrandPreview(!showBrandPreview)}
              className="w-full py-2.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
              {showBrandPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showBrandPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            {showBrandPreview && (
              <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: primaryColor + '30' }}>
                <div className="p-4" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl overflow-hidden flex-shrink-0 shadow-sm">
                      {form.logo && (form.logo.startsWith('data:') || form.logo.startsWith('http') || form.logo.startsWith('/uploads')) ? (
                        <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (form.logo || '🍔')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm" style={{ color: primaryTextColor }}>{form.name || 'Restaurant'}</p>
                      <p className="text-xs mt-0.5" style={{ color: primaryTextColor + 'cc' }}>{form.address || 'Address'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2" style={{ backgroundColor: secondaryColor }}>
                  <p className="text-xs font-medium" style={{ color: secondaryTextColor }}>Body text example</p>
                  <p className="text-[11px]" style={{ color: secondaryTextColor + 'cc' }}>This is how your text colors will look in the app.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Hours & Delivery === */}
        <SectionToggle icon={Clock} title="Hours & Delivery" section="hours" />
        {openSections.hours && (
          <div className="px-5 py-4 space-y-4 border-b border-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Opens At</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    className={`${inputClasses} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Closes At</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    className={`${inputClasses} pl-8`} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClasses}>Delivery Time (minutes)</label>
              <input type="number" value={form.estimatedDeliveryTime} onChange={(e) => setForm({ ...form, estimatedDeliveryTime: Number(e.target.value) })}
                min="15" max="120" className={inputClasses} />
            </div>
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.deliveryAvailable !== false} onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })}
                  className="w-4 h-4 accent-[#FF6B35] rounded" />
                <span className="text-sm font-medium text-gray-700">Delivery</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.pickupAvailable !== false} onChange={(e) => setForm({ ...form, pickupAvailable: e.target.checked })}
                  className="w-4 h-4 accent-[#FF6B35] rounded" />
                <span className="text-sm font-medium text-gray-700">Pickup</span>
              </label>
            </div>
          </div>
        )}

        {/* === Order Settings === */}
        <SectionToggle icon={ShoppingBag} title="Order Settings" section="orders" />
        {openSections.orders && (
          <div className="px-5 py-4 space-y-4 border-b border-gray-50">
            <div>
              <label className={labelClasses}>Minimum Order Amount (PKR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">Rs.</span>
                <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                  min="0" className={`${inputClasses} pl-9`} />
              </div>
            </div>
          </div>
        )}

        {/* === QR Codes === */}
        <SectionToggle icon={QrCode} title="QR Codes" section="qr" />
        {openSections.qr && (
          <div className="px-5 py-4 space-y-4 border-b border-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Owner Panel</p>
                <div className="flex justify-center">
                  <QRCodeSVG value={OWNER_URL} size={130} level="M" />
                </div>
                <button onClick={() => downloadQr('.owner-qr', `owner-qr-${restaurant.slug || 'panel'}.png`)}
                  className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                  <Download size={12} /> Download
                </button>
                <div className="owner-qr hidden"><QRCodeSVG value={OWNER_URL} size={200} level="M" /></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer Menu</p>
                <div className="flex justify-center">
                  <QRCodeSVG value={customerUrl} size={130} level="M" />
                </div>
                <button onClick={() => downloadQr('.customer-qr', `customer-qr-${restaurant.slug || 'menu'}.png`)}
                  className="w-full py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                  <Download size={12} /> Download
                </button>
                <div className="customer-qr hidden"><QRCodeSVG value={customerUrl} size={200} level="M" /></div>
              </div>
            </div>
          </div>
        )}

        {/* === Actions === */}
        <SectionToggle icon={Lock} title="Actions" section="actions" />
        {openSections.actions && (
          <div className="px-5 py-4 space-y-3 border-b border-gray-50">
            <button onClick={() => { toggleOpen(); toast.success(isOpen ? 'Store locked' : 'Store opened'); }}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isOpen ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}>
              {isOpen ? <PowerOff size={16} /> : <Power size={16} />}
              {isOpen ? 'Lock Store (Stop Orders)' : 'Open Store'}
            </button>
            <button onClick={() => {
              if (window.confirm('Delete ALL orders permanently? This cannot be undone.')) {
                clearAllOrders(); toast.success('All orders cleared');
              }
            }}
              className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
              <Trash2 size={16} /> Clear All Orders
            </button>
          </div>
        )}
      </div>

      {/* Single Save Button */}
      <button onClick={handleSaveAll}
        className="w-full mt-5 py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:shadow-lg hover:shadow-orange-200">
        <Save size={17} /> Save All Settings
      </button>
    </div>
  );
};

export default OwnerSettings;
