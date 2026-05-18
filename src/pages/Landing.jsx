import React, { useState } from 'react';
import { Search, CreditCard, Upload, CheckCircle, AlertCircle, Clock, Copy, ExternalLink, Utensils, Shield, Zap, Star } from 'lucide-react';
import { API_BASE } from '../utils/config';
import toast from 'react-hot-toast';

const Landing = () => {
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [error, setError] = useState('');

  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!paymentId.trim()) return;

    setLoading(true);
    setError('');
    setRestaurant(null);
    setPaymentMethods(null);
    setSubmitted(false);

    try {
      const res = await fetch(`${API_BASE}/payment-proofs/lookup/${paymentId.trim().toUpperCase()}`);
      const data = await res.json();
      console.log('Lookup response:', data);
      if (!data.success) {
        setError(data.message || 'Restaurant not found');
        return;
      }
      setRestaurant(data.restaurant);
      setPaymentMethods(data.payment_methods);
      setAmount(data.restaurant.amount_due.toString());
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Unable to fetch. Please check your Payment ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !amount || !selectedMethod) {
      toast.error('Please fill all fields and upload screenshot');
      return;
    }

    setSubmitting(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('image', image);
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: uploadForm
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');

      const body = {
        payment_id: paymentId.trim().toUpperCase(),
        amount: parseFloat(amount),
        plan: restaurant.plan,
        payment_method: selectedMethod,
        image: uploadData.data.url
      };

      const res = await fetch(`${API_BASE}/payment-proofs/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSubmitted(true);
      toast.success('Payment proof submitted!');
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#E63946] opacity-[0.03]" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-orange-100 mb-6">
              <Utensils size={18} className="text-[#FF6B35]" />
              <span className="text-sm font-medium text-gray-600">Food App Payment Portal</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Manage Your <span className="text-[#FF6B35]">Subscription</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
              Enter your unique Payment ID to view your subscription status, pay dues, and upload proof.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter Payment ID (e.g. A1234)"
                    value={paymentId}
                    onChange={(e) => setPaymentId(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none text-gray-800 font-medium text-lg tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                    maxLength={5}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !paymentId.trim()}
                  className="px-6 py-3.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    'Lookup'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-lg mx-auto px-4 mt-8 mb-8">
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 text-center">
            <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Restaurant Info */}
      {restaurant && !submitted && (
        <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] px-6 py-4">
              <h2 className="text-white font-bold text-xl">{restaurant.name}</h2>
              <p className="text-orange-100 text-sm">Plan: {restaurant.plan}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Payment ID</span>
                <span className="text-gray-900 font-mono font-bold text-lg tracking-wider">{restaurant.payment_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Status</span>
                {restaurant.is_expired ? (
                  <span className="flex items-center gap-1.5 text-red-600 font-semibold text-sm">
                    <AlertCircle size={16} /> Expired
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
                    <CheckCircle size={16} /> Active ({restaurant.days_left} days left)
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500 text-sm">Monthly Due</span>
                <span className="text-[#FF6B35] font-bold text-xl">Rs. {restaurant.amount_due.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-[#FF6B35]" /> Pay Via
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods?.jazzcash && (
                <button
                  onClick={() => { setSelectedMethod('JazzCash'); navigator.clipboard.writeText(paymentMethods.jazzcash); toast.success('JazzCash number copied!'); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === 'JazzCash' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                >
                  <p className="font-bold text-gray-800">{paymentMethods.jazzcash_name}</p>
                  <p className="text-gray-500 text-sm mt-1">{paymentMethods.jazzcash}</p>
                  <span className="text-xs text-[#FF6B35] mt-2 inline-block">Tap to copy & select</span>
                </button>
              )}
              {paymentMethods?.easypaisa && (
                <button
                  onClick={() => { setSelectedMethod('EasyPaisa'); navigator.clipboard.writeText(paymentMethods.easypaisa); toast.success('EasyPaisa number copied!'); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === 'EasyPaisa' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-200 hover:border-green-200'}`}
                >
                  <p className="font-bold text-gray-800">{paymentMethods.easypaisa_name}</p>
                  <p className="text-gray-500 text-sm mt-1">{paymentMethods.easypaisa}</p>
                  <span className="text-xs text-green-600 mt-2 inline-block">Tap to copy & select</span>
                </button>
              )}
              {paymentMethods?.bank_account && (
                <button
                  onClick={() => { setSelectedMethod('Bank'); navigator.clipboard.writeText(paymentMethods.bank_account); toast.success('Bank account copied!'); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all col-span-full ${selectedMethod === 'Bank' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <p className="font-bold text-gray-800">{paymentMethods.bank_name}</p>
                  <p className="text-gray-500 text-sm mt-1">{paymentMethods.bank_account}</p>
                  <span className="text-xs text-blue-600 mt-2 inline-block">Tap to copy & select</span>
                </button>
              )}
            </div>

            {/* Selected Method */}
            {selectedMethod && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-green-700 text-sm font-medium">Selected: {selectedMethod}</span>
              </div>
            )}
          </div>

          {/* Upload Screenshot */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-[#FF6B35]" /> Upload Payment Screenshot
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount Sent (Rs.)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Screenshot</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#FF6B35] transition-colors cursor-pointer" onClick={() => document.getElementById('fileUpload').click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div>
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Click to upload screenshot</p>
                      <p className="text-gray-400 text-xs mt-1">Max 5MB</p>
                    </div>
                  )}
                  <input id="fileUpload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedMethod || !image}
                className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Shield size={18} />
                )}
                {submitting ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success */}
      {submitted && (
        <div className="max-w-lg mx-auto px-4 pb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Proof Submitted!</h2>
            <p className="text-gray-500 text-sm mb-4">
              Your payment proof has been sent to the admin. Your subscription will be updated after verification.
            </p>
            <button
              onClick={() => { setSubmitted(false); setRestaurant(null); setPaymentId(''); setSelectedMethod(''); setImage(null); setImagePreview(null); }}
              className="text-[#FF6B35] font-semibold text-sm hover:underline"
            >
              Check Another Payment ID
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      {!restaurant && !error && !submitted && (
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-[#FF6B35]" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Search Your ID</h3>
              <p className="text-gray-500 text-sm">Enter your unique Payment ID to check subscription status</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Easy Payment</h3>
              <p className="text-gray-500 text-sm">Pay via JazzCash or EasyPaisa and upload your screenshot</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap size={24} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Instant Verification</h3>
              <p className="text-gray-500 text-sm">Admin verifies and activates your subscription quickly</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>&copy; 2026 Food App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
