import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import RestaurantCard from '../components/RestaurantCard';

const AllRestaurants = () => {
  const { restaurants } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter restaurants by search query
  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">All Restaurants</h1>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No restaurants found</h3>
          <p className="text-gray-500">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
};

export default AllRestaurants;
