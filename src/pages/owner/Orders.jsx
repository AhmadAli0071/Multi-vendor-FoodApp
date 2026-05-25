import React, { useState } from 'react';
import { Search, Phone, MapPin, ChevronDown, ChevronUp, Clock, CheckCircle, Package, Truck, CookingPot } from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';
import toast from 'react-hot-toast';

const OwnerOrders = () => {
  const { orders, updateOrderStatus } = useOwner();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const statuses = ['all', 'pending', 'accepted', 'preparing', 'ready', 'delivered'];

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchTerm || o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800', Pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800', Accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800', Preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800', Ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800', Delivered: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getNextStatus = (current) => {
    const flow = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
    return flow[current.toLowerCase()] || null;
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
  const getStatusStep = (status) => ['pending', 'accepted', 'preparing', 'ready', 'delivered'].indexOf(status.toLowerCase());
  const statusIcons = { pending: Clock, accepted: CheckCircle, preparing: CookingPot, ready: Package, delivered: Truck };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Orders</h1>
        <p className="text-xs text-gray-400">{filteredOrders.length} order(s)</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by ID or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent" />
      </div>

      {/* Status Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id;
            const nextStatus = getNextStatus(order.status);
            const nextLabel = getNextLabel(order.status);
            const statusStep = getStatusStep(order.status);
            const steps = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Delivered'];

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 active:bg-gray-50" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.id} · {order.type || 'Delivery'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{formatPKR(order.total)}</span>
                    {getStatusBadge(order.status)}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 space-y-4">
                    {/* Timeline */}
                    <div className="overflow-x-auto -mx-3 px-3">
                      <div className="flex items-center justify-between relative min-w-[320px] px-2">
                        <div className="absolute top-3 left-2 right-2 h-0.5 bg-gray-200"></div>
                        <div className="absolute top-3 left-2 h-0.5 bg-[#FF6B35] rounded" style={{ width: `${Math.max(0, (statusStep / 4) * 100 - 2)}%` }}></div>
                        {steps.map((step, idx) => {
                          const Icon = statusIcons[['pending', 'accepted', 'preparing', 'ready', 'delivered'][idx]] || Clock;
                          const done = idx <= statusStep;
                          const current = idx === statusStep;
                          return (
                            <div key={step} className="flex flex-col items-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? (current ? 'bg-[#FF6B35] text-white ring-2 ring-orange-100' : 'bg-[#FF6B35] text-white') : 'bg-gray-200 text-gray-400'}`}>
                                <Icon size={12} />
                              </div>
                              <span className={`text-[9px] mt-1 ${done ? 'text-[#FF6B35] font-medium' : 'text-gray-400'}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.phone}</p>
                        </div>
                      </div>
                      {order.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{order.address}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{order.type || 'Delivery'} · {formatDate(order.createdAt)}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600">{item.qty}x {item.name}</span>
                          <span className="font-medium">{formatPKR(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t pt-1.5">
                        <span>Total</span>
                        <span className="text-[#FF6B35]">{formatPKR(order.total)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {nextStatus && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          className="flex-1 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium active:bg-[#e55a2b]">
                          {nextLabel} Order
                        </button>
                        {order.status.toLowerCase() === 'pending' && (
                          <button onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium active:bg-red-100">
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
