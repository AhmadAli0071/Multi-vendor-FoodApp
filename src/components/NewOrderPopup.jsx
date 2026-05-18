import React, { useEffect, useState } from 'react';
import { Bell, X, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startRinging, stopRinging } from '../utils/sound';

const NewOrderPopup = ({ alert, onDismiss }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    startRinging(3000);
    return () => stopRinging();
  }, []);

  const handleView = () => {
    onDismiss(alert.orderId);
    navigate('/owner/orders');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-bounce-in">
        <div className="bg-[#FF6B35] p-4 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Bell size={28} className="animate-pulse" />
          </div>
          <h2 className="text-lg font-bold">New Order!</h2>
          <p className="text-white/80 text-xs">Customer is waiting</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-[#FF6B35]" />
            <div>
              <p className="text-sm font-bold text-gray-800">{alert.customerName}</p>
              <p className="text-xs text-gray-400">{alert.items} items</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <span className="text-2xl font-bold text-[#FF6B35]">PKR {alert.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex border-t">
          <button
            onClick={() => { stopRinging(); onDismiss(alert.orderId); }}
            className="flex-1 py-3 text-gray-500 font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <X size={16} /> Dismiss
          </button>
          <button
            onClick={handleView}
            className="flex-1 py-3 bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e55a2b]"
          >
            View Orders
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounceIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default NewOrderPopup;
