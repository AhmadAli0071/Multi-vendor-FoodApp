import React, { useState } from 'react';
import { Radio, CheckSquare, Send, Users, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Broadcast = () => {
  const { restaurants, sendBroadcast } = useAppContext();

  const [audienceType, setAudienceType] = useState('all');
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  // Get audience options with counts
  const getAudienceCount = (type) => {
    switch (type) {
      case 'all':
        return restaurants.length;
      case 'active':
        return restaurants.filter(r => {
          const today = new Date();
          const endDate = new Date(r.subscriptionEnd);
          return endDate >= today;
        }).length;
      case 'expiring':
        return restaurants.filter(r => {
          const today = new Date();
          const endDate = new Date(r.subscriptionEnd);
          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 7;
        }).length;
      default:
        return selectedRestaurants.length;
    }
  };

  // Handle restaurant selection (for "specific" audience)
  const toggleRestaurant = (id) => {
    setSelectedRestaurants(prev =>
      prev.includes(id)
        ? prev.filter(rId => rId !== id)
        : [...prev, id]
    );
  };

  // Get target restaurants based on audience selection
  const getTargetRestaurants = () => {
    if (audienceType === 'all') return restaurants;
    if (audienceType === 'active') {
      return restaurants.filter(r => {
        const today = new Date();
        const endDate = new Date(r.subscriptionEnd);
        return endDate >= today;
      });
    }
    if (audienceType === 'expiring') {
      return restaurants.filter(r => {
        const today = new Date();
        const endDate = new Date(r.subscriptionEnd);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 7;
      });
    }
    // Specific
    return restaurants.filter(r => selectedRestaurants.includes(r.id));
  };

  // Handle send
  const handleSend = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (audienceType === 'specific' && selectedRestaurants.length === 0) {
      toast.error('Please select at least one restaurant');
      return;
    }

    setShowConfirm(true);
  };

  // Confirm send
  const confirmSend = async () => {
    const targets = getTargetRestaurants();
    setSending(true);
    try {
      const restaurantIds = audienceType === 'specific' ? selectedRestaurants : [];
      await sendBroadcast({
        audienceType,
        restaurantIds,
        title,
        message
      });
      toast.success(`Broadcast sent to ${targets.length} restaurant${targets.length !== 1 ? 's' : ''}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
    setShowConfirm(false);
    setTitle('');
    setMessage('');
    setSelectedRestaurants([]);
    setAudienceType('all');
  };

  // Character count
  const charCount = message.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  // Preview content
  const previewTitle = title || 'Notification Title';
  const previewMessage = message || 'Your notification message will appear here...';
  const totalRecipients = getAudienceCount(audienceType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Broadcast Notifications</h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Audience Selector */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Audience</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={audienceType === 'all'}
                  onChange={() => setAudienceType('all')}
                  className="w-5 h-5 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <Radio className="ml-3 text-gray-400" size={20} />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">All Restaurants</p>
                  <p className="text-sm text-gray-500">{restaurants.length} restaurants</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="active"
                  checked={audienceType === 'active'}
                  onChange={() => setAudienceType('active')}
                  className="w-5 h-5 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <Radio className="ml-3 text-gray-400" size={20} />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Active Only</p>
                  <p className="text-sm text-gray-500">
                    {restaurants.filter(r => new Date(r.subscriptionEnd) >= new Date()).length} active restaurants
                  </p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="expiring"
                  checked={audienceType === 'expiring'}
                  onChange={() => setAudienceType('expiring')}
                  className="w-5 h-5 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <Radio className="ml-3 text-gray-400" size={20} />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Expiring Soon</p>
                  <p className="text-sm text-gray-500">
                    {restaurants.filter(r => {
                      const today = new Date();
                      const end = new Date(r.subscriptionEnd);
                      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                      return days > 0 && days <= 7;
                    }).length} restaurants expiring in 7 days
                  </p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="specific"
                  checked={audienceType === 'specific'}
                  onChange={() => setAudienceType('specific')}
                  className="w-5 h-5 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <CheckSquare className="ml-3 text-gray-400" size={20} />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Specific Restaurants</p>
                  <p className="text-sm text-gray-500">Choose from list below</p>
                </div>
              </label>
            </div>

            {/* Specific Restaurant Selection */}
            {audienceType === 'specific' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">Select Restaurants ({selectedRestaurants.length} selected)</p>
                <div className="space-y-2">
                  {restaurants.map(r => (
                    <label key={r.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRestaurants.includes(r.id)}
                        onChange={() => toggleRestaurant(r.id)}
                        className="w-4 h-4 text-[#FF6B35] rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Message</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Maintenance Notice"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/50</p>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your broadcast message here..."
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none resize-none"
                  maxLength={maxChars}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                    {charCount}/{maxChars} characters
                  </p>
                  {isOverLimit && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      Over limit
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isOverLimit}
              className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 mt-6 ${
                isOverLimit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
              }`}
            >
              <Send size={20} />
              <span>📨 Send Now</span>
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Preview</h2>
              <Users className="text-gray-400" size={20} />
            </div>

            {/* Preview Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {/* Notification Header */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🍔</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    FoodApp Admin
                  </p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{previewTitle}</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {previewMessage}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  Sent to {totalRecipients} restaurant{totalRecipients !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Summary Box */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">Broadcast Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Audience:</span>
                  <span className="font-medium capitalize">{audienceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-medium text-[#FF6B35]">{totalRecipients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium truncate max-w-[150px]">{title || '(Not set)'}</span>
                </div>
              </div>
            </div>

            {/* Warning for empty audience */}
            {audienceType === 'specific' && selectedRestaurants.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start space-x-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No restaurants selected</p>
                  <p className="text-sm text-yellow-700">Please select at least one restaurant to send broadcast.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Broadcast</h2>
              <p className="text-gray-600">
                You are about to send a notification to <span className="font-bold text-[#FF6B35]">{getTargetRestaurants().length}</span> restaurant{getTargetRestaurants().length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Message Preview in Modal */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
              <p className="text-sm text-gray-700">{message}</p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
              ⚠ This action cannot be undone. Are you sure?
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={sending}
                className="flex-1 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Yes, Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
