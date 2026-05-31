import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../context/AppContext';
import { uploadImage } from '../utils/api';
import { APP_URL, OWNER_URL, getCustomerAppUrl } from '../utils/config';
import toast from 'react-hot-toast';

const AddRestaurant = () => {
  const navigate = useNavigate();
  const { addRestaurant } = useAppContext();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    primaryColor: '#FF6B35',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Poppins',
    logo: '',
    logoPreview: null,
    deliveryAvailable: true,
    pickupAvailable: true,
    plan: 'Business',
    subscriptionStart: new Date().toISOString().split('T')[0],
    subscriptionEnd: ''
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const qrRef = useRef(null);
  const ownerQrRef = useRef(null);

  // Calculate end date when start date or plan changes
  useEffect(() => {
    if (formData.subscriptionStart) {
      const start = new Date(formData.subscriptionStart);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      setFormData(prev => ({
        ...prev,
        subscriptionEnd: end.toISOString().split('T')[0]
      }));
    }
  }, [formData.subscriptionStart]);

  // Auto-generate password
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast.success('Password generated!');
  };

  // Handle logo file upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoPreview: reader.result }));
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded!');
    } catch (error) {
      toast.error('Failed to upload logo: ' + error.message);
      setFormData(prev => ({ ...prev, logo: '' }));
    } finally {
      setUploadingLogo(false);
    }
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const slug = generateSlug(formData.name);

    const restaurant = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      address: formData.address,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      fontFamily: formData.fontFamily,
      logo: formData.logo || formData.logoPreview,
      slug,
      deliveryAvailable: formData.deliveryAvailable,
      pickupAvailable: formData.pickupAvailable,
      plan: formData.plan,
      subscriptionStart: formData.subscriptionStart,
      subscriptionEnd: formData.subscriptionEnd,
      active: true
    };

    const saved = await addRestaurant(restaurant);
    if (!saved) return;
    setNewRestaurant({ ...restaurant, ...saved });
    setShowSuccessModal(true);
    toast.success('Restaurant added successfully!');
  };

  // Plan details
  const plans = {
    Starter: { price: 2999, limit: '50 items' },
    Business: { price: 5999, limit: 'Unlimited items' },
    Premium: { price: 9999, limit: '+ Payment Gateway' }
  };

  const customerUrl = getCustomerAppUrl(generateSlug(formData.name || 'restaurant'));
  const ownerUrl = OWNER_URL;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Add New Restaurant</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                placeholder="e.g., Pizza Hub"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                placeholder="restaurant@foodapp.pk"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                  placeholder="Auto-generate or enter"
                  required
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Auto Generate
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                placeholder="0300-1234567"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                placeholder="923001234567"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none resize-none"
                placeholder="Full restaurant address"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Branding */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
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
                  placeholder="#FF6B35"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
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
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
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

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Upload
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50 transition-colors">
                  <Upload size={18} className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoPreview && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: null, logoPreview: null })}
                    className="p-2 text-gray-500 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Live Preview (Customer App)
            </label>
            <div className="flex justify-center">
              {/* Mobile Frame */}
              <div
                className="w-64 h-96 rounded-2xl overflow-hidden shadow-lg border-4 border-gray-800 relative"
                style={{ backgroundColor: formData.primaryColor }}
              >
                {/* Restaurant Header */}
                <div className="p-4 text-center">
                  {formData.logoPreview ? (
                    <img
                      src={formData.logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-white/20 flex items-center justify-center">
                      <span className="text-2xl text-white">🍽️</span>
                    </div>
                  )}
                  <h3
                    className="font-bold text-white truncate"
                    style={{ fontFamily: formData.fontFamily }}
                  >
                    {formData.name || 'Restaurant Name'}
                  </h3>
                </div>

                {/* Sample Menu */}
                <div className="bg-white mx-3 rounded-lg p-3 absolute bottom-4 left-3 right-3" style={{ backgroundColor: formData.secondaryColor }}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">MENU</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">Chicken Burger</span>
                      <span className="text-sm font-bold" style={{ color: formData.primaryColor }}>PKR 350</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">Pizza Slice</span>
                      <span className="text-sm font-bold" style={{ color: formData.primaryColor }}>PKR 200</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">Chai</span>
                      <span className="text-sm font-bold" style={{ color: formData.primaryColor }}>PKR 50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Delivery Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Delivery Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.deliveryAvailable}
                onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
              />
              <span className="text-gray-700 font-medium">Delivery Available</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pickupAvailable}
                onChange={(e) => setFormData({ ...formData, pickupAvailable: e.target.checked })}
                className="w-5 h-5 text-[#FF6B35] rounded focus:ring-[#FF6B35]"
              />
              <span className="text-gray-700 font-medium">Pickup Available</span>
            </label>
          </div>
        </div>

        {/* SECTION 4: Subscription */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Subscription Plan</h2>

          {/* Plan Radio Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(plans).map(([planName, details]) => (
              <label
                key={planName}
                className={`
                  relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${formData.plan === planName
                    ? 'border-[#FF6B35] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="plan"
                  value={planName}
                  checked={formData.plan === planName}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="sr-only"
                />
                <span className="font-bold text-gray-900 mb-1">{planName}</span>
                <span className="text-sm text-gray-500 mb-2">{details.limit}</span>
                <span className="text-lg font-bold text-[#FF6B35]">PKR {details.price.toLocaleString()}/mo</span>
                {formData.plan === planName && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-[#FF6B35] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </label>
            ))}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.subscriptionStart}
                onChange={(e) => setFormData({ ...formData, subscriptionStart: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.subscriptionEnd}
                onChange={(e) => setFormData({ ...formData, subscriptionEnd: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-lg transition-colors shadow-md flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Save & Generate QR</span>
          </button>
        </div>
      </form>

      {/* SUCCESS MODAL */}
      {showSuccessModal && newRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {/* Success Content */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Added!</h2>
              <p className="text-4xl font-bold text-[#FF6B35] mb-1">{newRestaurant.name}</p>
              {newRestaurant.paymentId && (
                <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 mt-2">
                  <span className="text-xs text-purple-500 font-medium">Payment ID</span>
                  <span className="text-lg font-bold text-purple-700 tracking-widest font-mono">{newRestaurant.paymentId}</span>
                </div>
              )}
            </div>

            {/* Customer URL */}
            <div className="bg-gray-50 rounded-lg p-4 mb-3 text-center">
              <p className="text-sm text-gray-500 mb-1">Customer App URL</p>
              <a
                href={customerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono text-sm"
              >
                {customerUrl}
              </a>
            </div>

            {/* Owner URL */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Owner Dashboard URL</p>
              <a
                href={ownerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6B35] hover:underline font-mono text-sm font-bold"
              >
                {ownerUrl}
              </a>
              <p className="text-xs text-gray-400 mt-1">Use credentials below to login</p>
            </div>

            {/* QR Codes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col items-center bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-2">Customer App QR</p>
                <div ref={qrRef}>
                  <QRCodeSVG value={customerUrl} size={160} level="H" includeMargin={true} />
                </div>
                <p className="text-xs text-gray-400 mt-2 break-all text-center">{customerUrl}</p>
                <button
                  onClick={() => {
                    const svg = qrRef.current?.querySelector('svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width; canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      const a = document.createElement('a');
                      a.download = `customer-qr-${newRestaurant.slug}.png`;
                      a.href = canvas.toDataURL('image/png'); a.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }}
                  className="mt-2 px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs hover:bg-[#e55a2b] transition-colors flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </button>
              </div>
              <div className="flex flex-col items-center bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-2">Owner Dashboard QR</p>
                <div ref={ownerQrRef}>
                  <QRCodeSVG value={ownerUrl} size={160} level="H" includeMargin={true} />
                </div>
                <p className="text-xs text-gray-400 mt-2 break-all text-center">{ownerUrl}</p>
                <button
                  onClick={() => {
                    const svg = ownerQrRef.current?.querySelector('svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width; canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      const a = document.createElement('a');
                      a.download = `owner-qr-${newRestaurant.slug}.png`;
                      a.href = canvas.toDataURL('image/png'); a.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }}
                  className="mt-2 px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs hover:bg-[#e55a2b] transition-colors flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download size={14} /> Print Both QRs
            </button>

            {/* Login Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Login Credentials</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-mono font-medium">{newRestaurant.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-mono font-medium">{newRestaurant.password}</span>
                </div>
              </div>
            </div>

            {/* Send via WhatsApp */}
            <div className="mb-6">
              {!newRestaurant.whatsapp && (
                <p className="text-xs text-yellow-600 text-center mb-2">⚠ WhatsApp number not provided. Fill WhatsApp field in form to enable this button.</p>
              )}
              <button
                onClick={() => {
                  if (!newRestaurant.whatsapp) {
                    toast.error('WhatsApp number is required');
                    return;
                  }
                  const message = encodeURIComponent(
                    `Assalam-o-Alaikum! ${newRestaurant.name} ke liye FoodApp login credentials:\n\n` +
                    `Email: ${newRestaurant.email}\n` +
                    `Password: ${newRestaurant.password}\n\n` +
                    `Owner Dashboard: ${ownerUrl}\n` +
                    `Customer App: ${customerUrl}\n\n` +
                    `Shukriya!`
                  );
                  window.open(`https://wa.me/${newRestaurant.whatsapp}?text=${message}`, '_blank');
                }}
                disabled={!newRestaurant.whatsapp}
                className={`w-full px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
                  newRestaurant.whatsapp
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>📱 Send via WhatsApp</span>
              </button>
            </div>

            {/* Close Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRestaurant;
