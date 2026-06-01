import React, { useState, useRef, useEffect } from 'react';
import { Search, Phone, MapPin, ChevronDown, ChevronUp, Clock, CheckCircle, Package, Truck, CookingPot, X, ChevronRight } from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';
import toast from 'react-hot-toast';

const OwnerOrders = () => {
  const { orders, updateOrderStatus } = useOwner();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const pillsRef = useRef(null);

  const statuses = ['all', 'pending', 'accepted', 'preparing', 'ready', 'delivered'];

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchTerm || o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      Pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
      Accepted: 'bg-blue-50 text-blue-700 border border-blue-200',
      preparing: 'bg-orange-50 text-orange-700 border border-orange-200',
      Preparing: 'bg-orange-50 text-orange-700 border border-orange-200',
      ready: 'bg-green-50 text-green-700 border border-green-200',
      Ready: 'bg-green-50 text-green-700 border border-green-200',
      delivered: 'bg-gray-100 text-gray-600 border border-gray-200',
      Delivered: 'bg-gray-100 text-gray-600 border border-gray-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
      Cancelled: 'bg-red-50 text-red-700 border border-red-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getNextStatus = (current) => {
    const flow = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
    const c = current.toLowerCase();
    return c === 'cancelled' || c === 'delivered' ? null : flow[c] || null;
  };

  const getNextLabel = (current) => {
    const labels = { pending: 'Accept', accepted: 'Prepare', preparing: 'Ready', ready: 'Deliver' };
    return labels[current.toLowerCase()] || null;
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} → ${newStatus}`);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const formatPKR = (amount) => `PKR ${amount.toLocaleString()}`;
  const getStatusStep = (status) => ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'].indexOf(status.toLowerCase());
  const statusIcons = { pending: Clock, accepted: CheckCircle, preparing: CookingPot, ready: Package, delivered: Truck, cancelled: X };

  const [showAllPills, setShowAllPills] = useState(false);
  const visibleStatuses = showAllPills ? statuses : statuses.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by ID or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] placeholder:text-gray-400" />
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-1.5">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              statusFilter === s
                ? 'bg-[#FF6B35] text-white shadow-sm shadow-orange-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 active:scale-95'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No orders found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id;
            const nextStatus = getNextStatus(order.status);
            const nextLabel = getNextLabel(order.status);
            const statusStep = getStatusStep(order.status);
            const isCancelled = order.status.toLowerCase() === 'cancelled';
            const isDelivered = order.status.toLowerCase() === 'delivered';
            const steps = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Delivered'];
            const activeSteps = isCancelled ? getStatusStep(order.status) : steps.length;

            return (
              <div key={order.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  isExpanded ? 'shadow-md border-gray-200' : 'shadow-sm border-gray-100 hover:border-gray-200 hover:shadow'
                }`}>
                {/* Collapsed Card */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-[#FF6B35]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{order.customerName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{order.id.slice(-12)} · {order.type || 'delivery'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-gray-900">{formatPKR(order.total)}</span>
                    {getStatusBadge(order.status)}
                    <ChevronRight size={15} className={`text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-3.5 pb-3.5 pt-3 space-y-4">
                    {/* Timeline */}
                    <div className="relative py-1">
                      <div className="flex items-center justify-between">
                        <div className="absolute top-3.5 left-3 right-3 h-0.5 bg-gray-100 rounded" />
                        <div
                          className="absolute top-3.5 left-3 h-0.5 bg-[#FF6B35] rounded transition-all duration-500"
                          style={{ width: isCancelled ? '0%' : `${(statusStep / Math.max(activeSteps - 1, 1)) * 100}%` }}
                        />
                        {steps.slice(0, activeSteps).map((step, idx) => {
                          const statusKey = ['pending', 'accepted', 'preparing', 'ready', 'delivered'][idx];
                          const Icon = statusIcons[statusKey] || Clock;
                          const done = idx <= statusStep && !isCancelled;
                          const current = idx === statusStep && !isCancelled;
                          return (
                            <div key={step} className="flex flex-col items-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                                done
                                  ? current
                                    ? 'bg-[#FF6B35] text-white ring-2 ring-orange-100 shadow-sm'
                                    : 'bg-[#FF6B35] text-white shadow-sm'
                                  : isCancelled && idx <= statusStep
                                    ? 'bg-red-100 text-red-500'
                                    : 'bg-gray-100 text-gray-400'
                              }`}>
                                {isCancelled && idx <= statusStep && idx === statusStep ? <X size={12} /> : <Icon size={12} />}
                              </div>
                              <span className={`text-[9px] mt-1 font-medium ${
                                done && !isCancelled ? 'text-[#FF6B35]' : isCancelled && idx <= statusStep ? 'text-red-500' : 'text-gray-400'
                              }`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">Customer</p>
                        <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{order.phone}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">Order</p>
                        <p className="text-xs text-gray-500">{order.id}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {order.address && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600">{order.address}</p>
                      </div>
                    )}

                    {order.notes && (
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <p className="text-[10px] text-amber-500 font-medium mb-1">Notes</p>
                        <p className="text-xs text-amber-700 italic">{order.notes}</p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600"><span className="font-medium text-gray-800">{item.qty}x</span> {item.name}</span>
                          <span className="font-medium text-gray-700">{formatPKR(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                        <span className="text-gray-700">Total</span>
                        <span className="text-[#FF6B35]">{formatPKR(order.total)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {nextStatus && !isCancelled && !isDelivered && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-all hover:bg-[#e55a2b] shadow-sm shadow-orange-200">
                          {nextLabel} Order
                        </button>
                        {order.status.toLowerCase() === 'pending' && (
                          <button onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all hover:bg-red-100 border border-red-100">
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerOrders;
