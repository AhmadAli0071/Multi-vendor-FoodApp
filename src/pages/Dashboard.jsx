import React from 'react';
import { Store, CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Dashboard = () => {
  const { restaurants } = useAppContext();

  const getSubStatus = (r) => {
    if (!r.active) return 'inactive';
    if (!r.subscriptionEnd) return 'no-sub';
    const endDate = new Date(r.subscriptionEnd);
    if (isNaN(endDate.getTime())) return 'no-sub';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (endDate < today) return 'expired';
    return 'active';
  };

  const todayCreated = restaurants.filter(r => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const activeSub = restaurants.filter(r => getSubStatus(r) === 'active').length;
  const inactiveSub = restaurants.filter(r => {
    const s = getSubStatus(r);
    return s === 'inactive' || s === 'expired' || s === 'no-sub';
  }).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{todayCreated}</p>
          <p className="text-sm text-gray-500 mt-1">Today's Restaurants</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{activeSub}</p>
          <p className="text-sm text-gray-500 mt-1">Active Subscriptions</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={28} className="text-red-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{inactiveSub}</p>
          <p className="text-sm text-gray-500 mt-1">Inactive / No Plan</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
