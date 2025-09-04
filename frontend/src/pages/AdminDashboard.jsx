import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionWarning, setSessionWarning] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    category: '',
    name: '',
    description: '',
    image: '',
    rating: 0,
    price: 0,
    originalPrice: 0,
    brand: '',
    assembly: '',
    colour: '',
    stock: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    material: '',
    packContent: '',
    weight: '',
    sku: ''
  });
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);
  const sessionWarningTimer = useRef(null);

  // Session timeout configuration (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (sessionWarningTimer.current) {
      clearTimeout(sessionWarningTimer.current);
    }

    setSessionWarning(false);

    // Set warning timer
    sessionWarningTimer.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      handleLogout();
      setError('Session expired due to inactivity');
    }, SESSION_TIMEOUT);
  };

  const handleUserActivity = () => {
    resetInactivityTimer();
  };

  useEffect(() => {
    checkAdminAccess();
    resetInactivityTimer();

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (sessionWarningTimer.current) {
        clearTimeout(sessionWarningTimer.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  const renderCancellations = () => {
    const cancellationRequests = orders.filter(order =>
      order.cancellationStatus === 'Pending' || order.cancellationStatus === 'Requested'
    );

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Cancellation Requests</h2>
        {loading ? (
          <p>Loading cancellation requests...</p>
        ) : cancellationRequests.length === 0 ? (
          <p className="text-gray-500">No pending cancellation requests.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancellation Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancellationRequests.map(order => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order._id.slice(-8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.userId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.cancellationReason || 'Not specified'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCancellationAction(order._id, 'approve')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancellationAction(order._id, 'reject')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Polling effect for live data updates
  useEffect(() => {
    const fetchActiveTabData = () => {
      if (activeTab === 'dashboard') {
        // Fetch all data for dashboard overview
        fetchData('users', setUsers);
        fetchData('products', setProducts);
        fetchData('orders', setOrders);
      } else if (activeTab === 'users') {
        fetchData('users', setUsers);
      } else if (activeTab === 'products') {
        fetchData('products', setProducts);
      } else if (activeTab === 'orders') {
        fetchData('orders', setOrders);
      } else if (activeTab === 'cancellations') {
        fetchData('orders', setOrders);
      }
    };

    // Fetch data immediately when tab changes
    fetchActiveTabData();

    // Set up polling every 10 seconds
    const interval = setInterval(fetchActiveTabData, 10000);

    // Cleanup interval on tab change or unmount
    return () => clearInterval(interval);
  }, [activeTab]);

  const checkAdminAccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.get('http://localhost:5000/api/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!data.user.isAdmin) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Admin access check failed:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to verify admin access');
      }
    }
  };

  const fetchData = async (endpoint, setData) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data[endpoint]);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(`Failed to fetch ${endpoint}`);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      category: '',
      name: '',
      description: '',
      image: '',
      rating: 0,
      price: 0,
      originalPrice: 0,
      brand: '',
      assembly: '',
      colour: '',
      stock: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      material: '',
      packContent: '',
      weight: '',
      sku: ''
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      category: product.category || '',
      name: product.name || '',
      description: product.description || '',
      image: product.image || '',
      rating: product.rating || 0,
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      brand: product.brand || '',
      assembly: product.assembly || '',
      colour: product.colour || '',
      stock: product.stock || 0,
      dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
      material: product.material || '',
      packContent: product.packContent || '',
      weight: product.weight || '',
      sku: product.sku || ''
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(product => product._id !== productId));
      setError('');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingProduct) {
        // Update product
        const response = await axios.put(`http://localhost:5000/api/admin/products/${editingProduct._id}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(products.map(product =>
          product._id === editingProduct._id ? response.data.product : product
        ));
      } else {
        // Create product
        const response = await axios.post('http://localhost:5000/api/admin/products', productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts([...products, response.data.product]);
      }
      setShowProductModal(false);
      setError('');
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('dimensions.')) {
      const dimension = name.split('.')[1];
      setProductForm(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: parseFloat(value) || 0
        }
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        [name]: name === 'price' || name === 'originalPrice' || name === 'rating' || name === 'stock'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  const renderDashboard = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-green-600">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-purple-600">{orders.length}</p>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Users Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.isAdmin ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Products Management</h2>
        <button
          onClick={handleAddProduct}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Product
        </button>
      </div>
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the local state
      setOrders(orders.map(order =>
        order._id === orderId
          ? { ...order, orderStatus: newStatus }
          : order
      ));

      // Refresh products data to show updated stock
      if (newStatus === 'Delivered') {
        await fetchData('products', setProducts);
      }

      setError('');
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const handleCancellationAction = async (orderId, action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const response = await axios.put(`http://localhost:5000/api/admin/orders/${orderId}/cancellation/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the local state
      setOrders(orders.map(order =>
        order._id === orderId
          ? { ...order, cancellationStatus: action === 'approve' ? 'Approved' : 'Rejected', orderStatus: action === 'approve' ? 'Cancelled' : order.orderStatus }
          : order
      ));

      // Refresh products data if stock was restored
      if (action === 'approve' && response.data.order.orderStatus === 'Delivered') {
        await fetchData('products', setProducts);
      }

      setError('');
    } catch (err) {
      console.error(`Error ${action}ing cancellation:`, err);
      setError(`Failed to ${action} cancellation request`);
    }
  };

  const renderOrders = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order._id.slice(-8)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.userId?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {order.orderStatus === 'Placed' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Processing')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Process
                        </button>
                      )}
                      {order.orderStatus === 'Processing' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Shipped')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Ship
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.orderStatus === 'Shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Delivered')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'dashboard'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'users'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'products'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('cancellations')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'cancellations'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Cancellations
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {sessionWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative m-4">
          <div className="flex justify-between items-center">
            <span>Your session will expire in 5 minutes due to inactivity.</span>
            <button
              onClick={resetInactivityTimer}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              Keep me logged in
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
          {error}
        </div>
      )}

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'cancellations' && renderCancellations()}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={productForm.category}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={productForm.name}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleFormChange}
                      rows="3"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('productImage', file);
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch('http://localhost:5000/api/admin/products/upload-image', {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${token}`
                            },
                            body: formData
                          });
                          if (!response.ok) {
                            throw new Error('Image upload failed');
                          }
                          const data = await response.json();
                          setProductForm(prev => ({ ...prev, image: data.imageUrl }));
                        } catch (error) {
                          console.error(error);
                          alert('Failed to upload image');
                        }
                      }}
                      className="mt-1 block w-full"
                    />
                    {productForm.image && (
                      <img src={`http://localhost:5000/${productForm.image}`} alt="Product" className="mt-2 max-h-40" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <input
                      type="number"
                      name="rating"
                      value={productForm.rating}
                      onChange={handleFormChange}
                      step="0.1"
                      min="0"
                      max="5"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Original Price</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={productForm.originalPrice}
                      onChange={handleFormChange}
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={productForm.brand}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assembly</label>
                    <input
                      type="text"
                      name="assembly"
                      value={productForm.assembly}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Colour</label>
                    <input
                      type="text"
                      name="colour"
                      value={productForm.colour}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={productForm.stock}
                      onChange={handleFormChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                    <input
                      type="number"
                      name="dimensions.length"
                      value={productForm.dimensions.length}
                      onChange={handleFormChange}
                      step="0.1"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                    <input
                      type="number"
                      name="dimensions.width"
                      value={productForm.dimensions.width}
                      onChange={handleFormChange}
                      step="0.1"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      name="dimensions.height"
                      value={productForm.dimensions.height}
                      onChange={handleFormChange}
                      step="0.1"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Material</label>
                    <input
                      type="text"
                      name="material"
                      value={productForm.material}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pack Content</label>
                    <input
                      type="text"
                      name="packContent"
                      value={productForm.packContent}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="text"
                      name="weight"
                      value={productForm.weight}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={productForm.sku}
                      onChange={handleFormChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
