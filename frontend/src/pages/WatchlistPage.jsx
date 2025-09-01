import React, { useState, useEffect } from 'react';
import {
  Heart,
  Star,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  Home
} from 'lucide-react';

const WatchlistPage = () => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewProduct, setViewProduct] = useState(null);
  const BACKEND_URL = 'http://localhost:5000';

  // Fetch watchlist items
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view your watchlist');
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/watchlist`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch watchlist');
        }

        const data = await response.json();
        setWatchlistItems(data);
      } catch (err) {
        console.error('Watchlist fetch error:', err);
        setError(err.message || 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  const handleRemoveFromWatchlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/watchlist/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Update local state
      setWatchlistItems(prev => prev.filter(item => item.productId._id !== productId));
      if (viewProduct && viewProduct._id === productId) {
        setViewProduct(null);
      }
    } catch (err) {
      console.error('Remove from watchlist error:', err);
      alert('Failed to remove item from watchlist');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      alert('Product added to cart!');
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add to cart');
    }
  };

  const isInWatchlist = (productId) => {
    return watchlistItems.some(item => item.productId._id === productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Loading your watchlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        {viewProduct && (
          <div className="bg-white border-b border-gray-200 py-4 mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button 
                onClick={() => setViewProduct(null)} 
                className="hover:text-blue-600 transition flex items-center"
              >
                <Home className="w-4 h-4 mr-1" />
                <span>Watchlist</span>
              </button>
              <span>/</span>
              <span className="truncate max-w-xs">{viewProduct.name}</span>
            </div>
          </div>
        )}

        {/* Main content */}
        {!viewProduct ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Your Watchlist</h1>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{watchlistItems.length} items</span>
              </div>
            </div>

            {/* Empty state */}
            {watchlistItems.length === 0 && (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-medium text-gray-700 mb-2">Your watchlist is empty</h2>
                <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                  Browse Products
                </button>
              </div>
            )}

            {/* Watchlist items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchlistItems.map((item) => (
                <div 
                  key={item._id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setViewProduct(item.productId)}
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.productId.image}
                      alt={item.productId.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWatchlist(item.productId._id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                    {/* Discount badge */}
                    {item.productId.originalPrice && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        {Math.round((1 - item.productId.price / item.productId.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate">{item.productId.name}</h3>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400 mr-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(item.productId.rating || 0) ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({item.productId.rating || 0})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-lg font-bold text-gray-800">₹{item.productId.price.toLocaleString()}</span>
                        {item.productId.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ₹{item.productId.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item.productId._id);
                        }}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Product Detail View */
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setViewProduct(null)}
              className="flex items-center space-x-2 mb-8 text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Watchlist</span>
            </button>
            
            {/* Product detail card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
              <div className="lg:flex">
                {/* Image */}
                <div className="lg:w-1/2 relative">
                  <img
                    src={viewProduct.image}
                    alt={viewProduct.name}
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                {/* Info */}
                <div className="lg:w-1/2 p-8 space-y-6">
                  <h1 className="text-4xl font-bold mb-4">{viewProduct.name}</h1>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-6">
                    <div className="flex text-yellow-400 mr-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-6 h-6 ${i < Math.floor(viewProduct.rating || 0) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="text-lg text-gray-600 font-medium">({viewProduct.rating || 0})</span>
                  </div>
                  
                  {/* Description */}
                  <p className="mb-8">{viewProduct.description}</p>
                  
                  {/* Features */}
                  <div className="flex space-x-6 border-y border-gray-200 py-6">
                    {viewProduct.brand && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Truck className="w-5 h-5" />
                        <span className="text-sm font-medium">Free Delivery</span>
                      </div>
                    )}
                    {viewProduct.material && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">2 Year Warranty</span>
                      </div>
                    )}
                    {viewProduct.colour && (
                      <div className="flex items-center space-x-2 text-purple-600">
                        <RotateCcw className="w-5 h-5" />
                        <span className="text-sm font-medium">Easy Returns</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Details Section */}
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
                    {viewProduct.brand && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Brand:</span>
                        <span className="text-gray-800 font-semibold">{viewProduct.brand}</span>
                      </div>
                    )}
                    {viewProduct.material && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Material:</span>
                        <span className="text-gray-800">{viewProduct.material}</span>
                      </div>
                    )}
                    {viewProduct.colour && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Color:</span>
                        <span className="text-gray-800">{viewProduct.colour}</span>
                      </div>
                    )}
                    {viewProduct.dimensions && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Dimensions:</span>
                        <span className="text-gray-800">
                          {viewProduct.dimensions.length}×{viewProduct.dimensions.width}×{viewProduct.dimensions.height} cm
                        </span>
                      </div>
                    )}
                    {viewProduct.weight && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Weight:</span>
                        <span className="text-gray-800">{viewProduct.weight}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price & Buttons */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl font-bold text-green-600">₹{viewProduct.price.toLocaleString()}</span>
                      {viewProduct.originalPrice && (
                        <>
                          <span className="text-xl text-gray-500 line-through">₹{viewProduct.originalPrice.toLocaleString()}</span>
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                            {Math.round((1 - viewProduct.price / viewProduct.originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex space-x-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(viewProduct._id);
                        }} 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-semibold text-lg"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWatchlist(viewProduct._id);
                        }}
                        className="p-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                      >
                        <Heart className="w-6 h-6 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;