import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, RefreshCw, ArrowUpRight, X, CheckCircle, Ban, Image } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const Subscriptions = () => {
  const { restaurants, renewSubscription, updateRestaurant } = useAppContext();
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [renewData, setRenewData] = useState({ months: 1, paymentMethod: 'Cash' });

  // Payment Proofs
  const [paymentProofs, setPaymentProofs] = useState([]);
  const fetchProofs = async () => {
    try {
      const t = localStorage.getItem('admin_token');
      const res = await fetch(`${API}/payment-proofs/pending`, { headers: { 'Authorization': `Bearer ${t}` } });
      const data = await res.json();
      if (data.success) setPaymentProofs(data.proofs);
    } catch (err) { /* */ }
  };
  const handleApproveProof = async (proofId) => {
    try {
      const t = localStorage.getItem('admin_token');
      const r = await fetch(`${API}/payment-proofs/${proofId}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` } });
      const d = await r.json();
      if (d.success) { toast.success(d.message); fetchProofs(); } else throw new Error(d.message);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };
  const handleRejectProof = async (proofId) => {
    try {
      const t = localStorage.getItem('admin_token');
      const r = await fetch(`${API}/payment-proofs/${proofId}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` }, body: JSON.stringify({ note: 'Rejected' }) });
      const d = await r.json();
      if (d.success) { toast.success('Rejected'); fetchProofs(); } else throw new Error(d.message);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };
  useEffect(() => { fetchProofs(); }, []);

  const sortedRestaurants = [...restaurants].sort((a, b) => new Date(a.subscriptionEnd) - new Date(b.subscriptionEnd));
  const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };
  const getPlanPrice = (plan) => planPrices[plan] || 0;

  const stats = {
    active: restaurants.filter(r => { const t = new Date(); return new Date(r.subscriptionEnd) >= t; }).length,
    expiring: restaurants.filter(r => { const t = new Date(); const e = new Date(r.subscriptionEnd); const d = Math.ceil((e - t) / 86400000); return d > 0 && d <= 7; }).length,
    expired: restaurants.filter(r => { const t = new Date(); return new Date(r.subscriptionEnd) < t; }).length,
    mrr: restaurants.filter(r => { const t = new Date(); return new Date(r.subscriptionEnd) >= t; }).reduce((s, r) => s + getPlanPrice(r.plan), 0)
  };

  const getSubscriptionInfo = (r) => {
    const t = new Date(); const e = new Date(r.subscriptionEnd);
    const d = Math.ceil((e - t) / 86400000);
    if (d < 0) return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800', daysLeft: 0 };
    if (d <= 7) return { status: 'expiring', label: `Expiring in ${d}d`, color: 'bg-yellow-100 text-yellow-800', daysLeft: d };
    return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800', daysLeft: d };
  };

  const getProgress = (r) => {
    const t = new Date(); const s = new Date(r.subscriptionStart); const e = new Date(r.subscriptionEnd);
    const total = Math.ceil((e - s) / 86400000); const left = Math.ceil((e - t) / 86400000);
    if (left < 0) return 100; return Math.min(((total - Math.max(0, left)) / total) * 100, 100);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatPKR = (a) => `PKR ${a.toLocaleString()}`;

  const handleRenew = () => {
    if (!selectedRestaurant) return;
    renewSubscription(selectedRestaurant.id, renewData.months);
    setShowRenewModal(false);
    toast.success(`Renewed for ${renewData.months} month(s)!`);
    setRenewData({ months: 1, paymentMethod: 'Cash' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Subscriptions</h1>
      </div>

      {/* Pending Payment Proofs */}
      {paymentProofs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Image size={20} className="text-[#FF6B35]" /> Pending Payment Proofs
          </h2>
          <div className="space-y-4">
            {paymentProofs.map(proof => (
              <div key={proof._id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{proof.restaurant_name}</p>
                    <p className="text-sm text-gray-500">{proof.plan} Plan · {new Date(proof.created_at).toLocaleDateString()}</p>
                    <p className="text-lg font-bold text-[#FF6B35] mt-1">PKR {proof.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Approved: ~{proof.months_to_add} month(s)</p>
                  </div>
                </div>
                {proof.image && (
                  <img src={proof.image} alt="Payment proof" className="w-full rounded-lg border max-h-64 object-cover mb-3 cursor-pointer" onClick={() => window.open(proof.image)} />
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleApproveProof(proof._id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-green-700">
                    <CheckCircle size={16} /> Approve & Renew
                  </button>
                  <button onClick={() => handleRejectProof(proof._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-red-100">
                    <Ban size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-3xl font-bold text-green-600">{stats.active}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CreditCard className="text-green-600" size={24} /></div></div></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Expiring</p><p className="text-3xl font-bold text-yellow-600">{stats.expiring}</p></div><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><Calendar className="text-yellow-600" size={24} /></div></div></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Expired</p><p className="text-3xl font-bold text-red-600">{stats.expired}</p></div><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><X className="text-red-600" size={24} /></div></div></div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">MRR</p><p className="text-3xl font-bold text-green-600">{formatPKR(stats.mrr)}</p></div><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><DollarSign className="text-green-600" size={24} /></div></div></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50"><tr className="text-left text-sm text-gray-600 border-b"><th className="px-6 py-4 font-medium">Restaurant</th><th className="px-6 py-4 font-medium">Plan</th><th className="px-6 py-4 font-medium">Amount</th><th className="px-6 py-4 font-medium">Start Date</th><th className="px-6 py-4 font-medium">End Date</th><th className="px-6 py-4 font-medium">Days Left</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
            <tbody>
              {sortedRestaurants.map((restaurant) => {
                const subInfo = getSubscriptionInfo(restaurant);
                const progress = getProgress(restaurant);
                return (
                  <tr key={restaurant.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4"><div><p className="font-bold text-gray-900">{restaurant.name}</p><p className="text-sm text-gray-500">{restaurant.email}</p></div></td>
                    <td className="px-6 py-4"><span className="font-medium text-gray-900">{restaurant.plan}</span></td>
                    <td className="px-6 py-4"><span className="font-bold text-[#FF6B35]">{formatPKR(planPrices[restaurant.plan] || 0)}</span></td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(restaurant.subscriptionStart)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(restaurant.subscriptionEnd)}</td>
                    <td className="px-6 py-4"><div className="w-full"><div className="w-full bg-gray-200 rounded-full h-2 mb-1"><div className={`h-2 rounded-full ${subInfo.status === 'expired' ? 'bg-red-500' : subInfo.status === 'expiring' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }} /></div><p className="text-xs text-gray-600">{subInfo.daysLeft} days</p></div></td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${subInfo.color}`}>{subInfo.label}</span></td>
                    <td className="px-6 py-4"><div className="flex space-x-2">
                      <button onClick={() => { setSelectedRestaurant(restaurant); setShowRenewModal(true); }} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium"><RefreshCw size={14} className="inline mr-1" />Renew</button>
                      <button className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium"><ArrowUpRight size={14} className="inline mr-1" />Change</button>
                      <button onClick={() => { setSelectedRestaurant(restaurant); setShowHistoryModal(true); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium">History</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl max-w-md w-full p-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Renew Subscription</h2><button onClick={() => setShowRenewModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="space-y-4"><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-500 mb-1">Renewing for</p><p className="font-bold text-lg text-gray-900">{selectedRestaurant.name}</p><p className="text-sm text-gray-600">{selectedRestaurant.plan} Plan</p></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Duration</label><div className="grid grid-cols-4 gap-2">{[1, 3, 6, 12].map(m => (<button key={m} onClick={() => setRenewData({ ...renewData, months: m })} className={`py-2 rounded-lg border-2 transition-colors font-medium ${renewData.months === m ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>{m} {m === 1 ? 'Mo' : 'Mos'}</button>))}</div></div><div className="bg-blue-50 rounded-lg p-4 border border-blue-200"><div className="flex justify-between items-center"><span className="text-gray-700 font-medium">Total</span><span className="text-2xl font-bold text-[#FF6B35]">{formatPKR((planPrices[selectedRestaurant.plan] || 0) * renewData.months)}</span></div></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label><select value={renewData.paymentMethod} onChange={(e) => setRenewData({ ...renewData, paymentMethod: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none bg-white"><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="JazzCash">JazzCash</option></select></div><button onClick={handleRenew} className="w-full py-3 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"><RefreshCw size={20} /><span>Mark as Paid & Extend</span></button></div></div></div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-xl max-w-md w-full p-6"><div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-bold text-gray-900">Payment History</h2><p className="text-sm text-gray-500">{selectedRestaurant.name}</p></div><button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="space-y-3">{[{ month: 'May 2026', amount: planPrices[selectedRestaurant.plan], date: '2026-05-01', status: 'Paid' }, { month: 'Apr 2026', amount: planPrices[selectedRestaurant.plan], date: '2026-04-01', status: 'Paid' }, { month: 'Mar 2026', amount: planPrices[selectedRestaurant.plan], date: '2026-03-01', status: 'Paid' }].map((p, i) => (<div key={i} className="border border-gray-200 rounded-lg p-4"><div className="flex justify-between items-start"><div><p className="font-medium text-gray-900">{p.month}</p><p className="text-sm text-gray-500">{p.date}</p></div><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">{p.status}</span></div><div className="mt-2 flex justify-between"><span className="text-gray-600">{selectedRestaurant.plan}</span><span className="font-bold text-[#FF6B35]">{formatPKR(p.amount)}</span></div></div>))}</div><div className="mt-6"><button onClick={() => setShowHistoryModal(false)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium">Close</button></div></div></div>
      )}
    </div>
  );
};

export default Subscriptions;
