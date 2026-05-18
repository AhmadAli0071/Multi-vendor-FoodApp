import React from 'react';

const StatCard = ({ icon: Icon, label, value, color = 'blue', hasPulse = false }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} relative`}>
          <Icon size={24} />
          {hasPulse && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
