import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Heart
} from 'lucide-react';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const token = localStorage.getItem('token');

  // Fetch cart items and watchlist on component mount
  useEffect(() => {
    if (!token) {
      setError('Please log in to view your cart');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [cartRes, watchlistRes] = await Promise.all([
          axios.get('http://localhost:5000/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/watchlist', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCartItems(cartRes.data.items || []);
        // Watchlist data is returned as an array directly
        const watchlistData = watchlistRes.data || [];
        console.log('Watchlist data:', watchlistData); // Debug log
        setWatchlist(watchlistData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [cartItemId]: true }));
    
    try {
      await axios.patch(
        `http://localhost:5000/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartItems(prev => 
        prev.map(item => 
          item._id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error('Update error:', err.response?.data || err.message);
      alert('Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleDeleteItem = async (cartItemId) => {
    setUpdating(prev => ({ ...prev, [cartItemId]: true }));
    
    try {
      await axios.delete(`http://localhost:5000/api/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(prev => prev.filter(item => item._id !== cartItemId));
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      alert('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleToggleWatchlist = async (productId) => {
    if (!token) {
      alert('Please login to manage your watchlist');
      return;
    }

    const isInWatchlist = watchlist.some(item => item.productId._id === productId);
    setUpdating(prev => ({ ...prev, [productId]: true }));

    try {
      if (isInWatchlist) {
        // Use correct endpoint for removing from watchlist
        await axios.delete(`http://localhost:5000/api/watchlist/remove`, {
          data: { productId }, // Send productId in request body
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlist(prev => prev.filter(item => item.productId._id !== productId));
      } else {
        // Use correct endpoint for adding to watchlist
        const response = await axios.post(
          `http://localhost:5000/api/watchlist/add`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Add the new item to watchlist (response.data.item contains the watchlist entry)
        if (response.data.item) {
          setWatchlist(prev => [...prev, response.data.item]);
        }
      }
    } catch (err) {
      console.error('Watchlist error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Unknown error';
      alert(`Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist: ${errorMessage}`);
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isInWatchlist = (productId) => {
    return watchlist.some(item => {
      if (item.productId) {
        return item.productId._id === productId;
      }
      return false;
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.productId.price * item.quantity), 0);
  };

  const calculateSavings = () => {
    return cartItems.reduce((savings, item) => 
      savings + ((item.productId.originalPrice - item.productId.price) * item.quantity), 0
    );
  };

  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => total + (item.productId.originalPrice * item.quantity), 0);
  };

  const getStockStatus = (stock) => {
    return stock > 0 ? 'In Stock' : 'Out of Stock';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Required</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <a 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <p className="text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Discover amazing products and add them to your cart</p>
            <a
              href="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.productId;
                const isUpdating = updating[item._id];
                const isProductInWatchlist = isInWatchlist(product._id);
                const stockStatus = getStockStatus(product.stock);
                
                return (
                  <div
                    key={item._id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition ${
                      isUpdating ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg bg-gray-100"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                          }}
                        />
                        <button
                          onClick={() => handleToggleWatchlist(product._id)}
                          disabled={updating[product._id]}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-110 transition"
                        >
                          <Heart className={`h-5 w-5 ${
                            isProductInWatchlist ? 'text-red-500 fill-current' : 'text-gray-600'
                          }`} />
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                            {product.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            disabled={isUpdating}
                            className="text-gray-400 hover:text-red-500 transition p-1 disabled:opacity-50"
                            title="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Stock Status */}
                        <div className="mb-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {stockStatus}
                          </span>
                        </div>

                        {/* Price and Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-green-600">
                              ₹{(product.price * item.quantity).toLocaleString()}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{(product.originalPrice * item.quantity).toLocaleString()}
                              </span>
                            )}
                            {product.rating && (
                              <span className="text-yellow-500 text-sm flex items-center gap-1">
                                ⭐ {product.rating}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-medium">
                              {isUpdating ? '...' : item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              disabled={isUpdating || product.stock <= item.quantity}
                              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Added Date */}
                        <p className="text-xs text-gray-400 mt-3">
                          Added on {new Date(item.addedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>₹{calculateOriginalTotal().toLocaleString()}</span>
                  </div>
                  {calculateSavings() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>You Save</span>
                      <span>-₹{calculateSavings().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                <a
                  href="/checkout"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition mb-3 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="/products"
                  className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition text-center block"
                >
                  Continue Shopping
                </a>

                {/* Security Badge */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    🔒 Secure checkout with SSL encryption
                  </p>
                </div>
              </div>

              {/* Watchlist Preview */}
              {watchlist.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Watchlist</h2>
                  <div className="space-y-3">
                    {watchlist.slice(0, 3).map(item => {
                      // Defensive check for productId existence
                      if (!item.productId || !item.productId._id) {
                        console.warn('Watchlist item missing productId:', item);
                        return null;
                      }
                      return (
                        <div key={item._id} className="flex items-center gap-3">
                          <img
                            src={item.productId.image || 'https://via.placeholder.com/150x150?text=No+Image'}
                            alt={item.productId.name || 'Product'}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.productId.name || 'Unknown Product'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ₹{(item.productId.price || 0).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggleWatchlist(item.productId._id)}
                            className="text-red-500 hover:text-red-700 transition"
                            disabled={updating[item.productId._id]}
                            title="Remove from watchlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {watchlist.length > 3 && (
                    <a
                      href="/account/watchlist"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-3 inline-block"
                    >
                      View all {watchlist.length} items
                    </a>
                  )}
                </div>
              )}

              {/* Empty Watchlist Message */}
              {watchlist.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6 text-center">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No items in watchlist</h3>
                  <p className="text-gray-500 text-sm">Add items to your watchlist while shopping to keep track of products you're interested in.</p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default CartPage;