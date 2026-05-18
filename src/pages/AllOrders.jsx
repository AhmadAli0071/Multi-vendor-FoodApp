import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const AllOrders = () => {
  const { orders, restaurants } = useAppContext();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    restaurant: 'all',
    date: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    const rId = order.restaurantId || order.restaurant_id;
    if (filters.restaurant !== 'all' && rId !== filters.restaurant) return false;
    if (filters.date && !(order.createdAt || order.created_at || '').startsWith(filters.date)) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  // Get restaurant name
  const getRestaurantName = (order) => {
    if (order.restaurantName) return order.restaurantName;
    if (order.restaurant_name) return order.restaurant_name;
    const id = order.restaurantId || order.restaurant_id;
    const r = restaurants.find(r => r.id === id);
    return r ? r.name : 'Unknown';
  };

  // Format time relative
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-PK');
  };

  // Status badge colors
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-blue-100 text-blue-800 border-blue-200',
      preparing: 'bg-orange-100 text-orange-800 border-orange-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  // Parse items string into array (for demo, we'll simulate)
  const parseItems = (itemsStr) => {
    return itemsStr.split(',').map(item => item.trim());
  };

  // Expand order details
  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Timeline steps with real timestamps from status_history
  const getTimeline = (order) => {
    const steps = [
      { name: 'Order Placed', key: 'pending' },
      { name: 'Accepted', key: 'accepted' },
      { name: 'Preparing', key: 'preparing' },
      { name: 'Ready', key: 'ready' },
      { name: 'Delivered', key: 'delivered' }
    ];

    // Build map from status_history
    const historyMap = {};
    if (order.status_history) {
      order.status_history.forEach(h => {
        historyMap[h.status] = h.timestamp;
      });
    }
    // Fallback: use createdAt for pending if no history
    if (!historyMap['pending'] && order.createdAt) {
      historyMap['pending'] = order.createdAt;
    }

    return steps.map(step => ({
      name: step.name,
      time: historyMap[step.key] || null,
      completed: !!historyMap[step.key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
        <div className="text-sm text-gray-500">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Restaurant Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
            <div className="relative">
              <select
                value={filters.restaurant}
                onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
              >
                <option value="all">All Restaurants</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', restaurant: 'all', date: '' })}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {paginatedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Restaurant</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{getRestaurantName(order)}</td>
                      <td className="px-6 py-4 text-gray-700">{order.customerName}</td>
                      <td className="px-6 py-4 text-gray-600">{order.customerPhone}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm truncate max-w-[150px]">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">PKR {order.total.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                        {formatTime(order.createdAt)}
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan="8" className="px-6 py-0">
                          <div className="bg-blue-50 rounded-lg p-6 mb-4">
                            {/* Order Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              {/* Items List */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3">Order Items</h4>
                                <div className="space-y-2">
                                  {parseItems(order.items).map((item, idx) => {
                                    // Generate random price for demo
                                    const price = Math.floor(Math.random() * 500) + 100;
                                    return (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{item.trim()}</span>
                                        <span className="font-medium text-gray-900">PKR {price}</span>
                                      </div>
                                    );
                                  })}
                                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-[#FF6B35]">PKR {order.total.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3">Customer Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">Name:</span>
                                    <span className="ml-2 font-medium">{order.customerName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Phone:</span>
                                    <span className="ml-2 font-medium">{order.customerPhone}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Address:</span>
                                    <span className="ml-2 font-medium">
                                      {restaurants.find(r => r.id === (order.restaurantId || order.restaurant_id))?.address || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Order Timeline */}
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4">Order Timeline</h4>
                              <div className="flex flex-wrap gap-2">
                                {getTimeline(order).map((step, idx) => (
                                  <React.Fragment key={idx}>
                                    <div className="flex items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                      }`}>
                                        {step.completed ? '✓' : idx + 1}
                                      </div>
                                      <div className="ml-2">
                                        <p className="text-sm font-medium text-gray-900">{step.name}</p>
                                        <p className="text-xs text-gray-500">{formatTime(step.time)}</p>
                                      </div>
                                    </div>
                                    {idx < 4 && (
                                      <div className={`w-8 h-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
