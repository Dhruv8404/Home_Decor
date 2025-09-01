import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Heart,
  Star,
  ArrowLeft,
  Home,
  Grid,
  List,
  Truck,
  Shield,
  RotateCcw,
} from 'lucide-react';



const categories = [
  {
    name: 'Home Decor Items',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=60&fit=crop',
    gradient: 'from-orange-400 to-pink-500',
  },
  {
    name: 'Wall Shelves',
    icon: '📚',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=60&fit=crop',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    name: 'Wall Mirrors',
    icon: '🪞',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=100&h=60&fit=crop',
    gradient: 'from-purple-400 to-indigo-500',
  },
  {
    name: 'Wall Clocks',
    icon: '🕐',
    image: 'https://images.unsplash.com/photo-1508669232496-137b159c1cdb?w=100&h=60&fit=crop',
    gradient: 'from-green-400 to-teal-500',
  },
  {
    name: 'Photo Frames',
    icon: '🖼️',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=60&fit=crop',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    name: 'Pots & Planters',
    icon: '🪴',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&h=60&fit=crop',
    gradient: 'from-emerald-400 to-green-500',
  },
];

const Dashboard = () => {

  const [currentCategory, setCurrentCategory] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const [viewLayout, setViewLayout] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watchlist, setWatchlist] = useState([]);

  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    if (currentCategory) {
      setLoading(true);
      setError('');
      fetch(`${BACKEND_URL}/api/products?category=${encodeURIComponent(currentCategory)}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          return res.json();
        })
        .then((data) => {
          console.log('Fetched data:', data);
          setProducts(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Fetch error:', err);
          setError('Failed to fetch products.');
          setLoading(false);
        });
    } else {
      setProducts([]);
    }
  }, [currentCategory]);

  const handleCategoryClick = (name) => {
    setCurrentCategory(name);
    setViewProduct(null);
  };

  const handleBackToHome = () => {
    setCurrentCategory(null);
    setViewProduct(null);
    setError('');
  };

  const handleProductClick = (product) => {
    setViewProduct(product);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const sortedProducts = () => {
    const sorted = [...products];
    if (sortOrder === 'low-high') sorted.sort((a, b) => a.price - b.price);
    if (sortOrder === 'high-low') sorted.sort((a, b) => b.price - a.price);
    return sorted;
  };

  const isInWatchlist = (productId) => {
    return watchlist.some(item => item.productId === productId);
  };

  const handleToggleWatchlist = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to manage your watchlist.');
      return;
    }

    if (isInWatchlist(productId)) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/watchlist/remove`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (res.ok) {
          alert('Removed from watchlist');
          setWatchlist(prev => prev.filter(item => item.productId !== productId));
        } else {
          alert(`Error: ${data.message}`);
        }
      } catch (err) {
        console.error('Error removing from watchlist:', err);
        alert('Failed to remove from watchlist.');
      }
    } else {
      try {
        const res = await fetch(`${BACKEND_URL}/api/watchlist/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (res.ok) {
          alert('Product added to watchlist!');
          setWatchlist(prev => [...prev, { productId }]);
        } else {
          alert(`Error: ${data.message}`);
        }
      } catch (err) {
        console.error('Error adding to watchlist:', err);
        alert('Failed to add to watchlist.');
      }
    }
  };

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('Product added to cart!');
        console.log('Add to cart response:', data);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || 'Failed to add'}`);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Hero Banner (only on home) */}
      {!viewProduct && !currentCategory && (
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
          <div className="relative bg-gradient-to-r from-blue-700 to-purple-800 text-white py-24 px-4 text-center">
            <h1 className="text-6xl font-bold mb-6 bg-clip-text bg-gradient-to-r from-white to-blue-100 text-transparent">
              Transform Your Space
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Discover beautiful home decor items that reflect your style and personality.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-shadow shadow-lg">
                Shop Collection
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-shadow shadow-lg">
                View Trending
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      {(currentCategory || viewProduct) && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={handleBackToHome} className="hover:text-blue-600 transition">
              <Home className="w-4 h-4" />
            </button>
            <span>/</span>
            {currentCategory && (
              <button onClick={handleBackToHome} className="hover:text-blue-600 transition">{currentCategory}</button>
            )}
            {viewProduct && (
              <>
                <span>/</span>
                <span className="truncate max-w-xs">{viewProduct.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Category selection */}
      {!currentCategory && !viewProduct && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(cat.name)}
                className="group relative overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-lg"
              >
                <div className="aspect-w-16 aspect-h-12 bg-white">
                  <img src={cat.image} alt={cat.name} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`}></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <div className="text-white">
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
                      <p className="text-sm opacity-90">Explore Collection</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show loading/error */}
      {loading && <p className="text-center mb-4">Loading products...</p>}
      {error && <p className="text-center mb-4 text-red-500">{error}</p>}

      {/* Products list */}
      {currentCategory && products.length > 0 && !viewProduct && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with sort and view toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
            <h2 className="text-4xl font-bold">{currentCategory}</h2>
            <div className="flex items-center space-x-4">
              {/* View toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-2 rounded ${viewLayout === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewLayout('list')}
                  className={`p-2 rounded ${viewLayout === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              {/* Sorting */}
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value="default">Sort by Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product grid/list */}
          <div
            className={`grid gap-8 ${viewLayout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}
          >
            {sortedProducts().map((product) => (
              <div
                key={product._id}
                className={`group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  viewLayout === 'list' ? 'flex' : ''
                }`}
                onClick={() => handleProductClick(product)}
              >
                {/* Product card */}
                <div className={`relative overflow-hidden ${viewLayout === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full object-cover transition-transform duration-500 ${
                      viewLayout === 'list' ? 'h-full w-48' : 'h-64'
                    }`}
                  />
                  {/* Wishlist button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWatchlist(product._id);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
                  >
                    <Heart className={`w-5 h-5 ${isInWatchlist(product._id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                  </button>
                  {/* Discount badge */}
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>
                {/* Product info */}
                <div className={`p-6 flex-1 ${viewLayout === 'list' ? 'flex flex-col justify-between' : ''}`}>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">({product.rating || 0})</span>
                    </div>
                  </div>
                  {/* Price & Add to cart */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-green-600">₹{product.price.toLocaleString()}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      {product.brand && <span className="text-xs text-gray-500 mt-1">by {product.brand}</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product._id);
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
        </div>
      )}

      {/* Product details view */}
      {viewProduct && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => setViewProduct(null)}
            className="flex items-center space-x-2 mb-8 text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to {currentCategory}</span>
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
                        handleToggleWatchlist(viewProduct._id);
                      }}
                      className={`p-4 rounded-xl transition ${
                        isInWatchlist(viewProduct._id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isInWatchlist(viewProduct._id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Dashboard;