import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package, Calendar, CreditCard, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Eye, RotateCcw, AlertCircle } from "lucide-react";
import OrderStatusProgress from "../components/OrderStatusProgress";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const BACKEND_URL = 'http://localhost:5000';

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Request order cancellation
  const requestCancellation = async (orderId, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
        reason: reason
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update order in local state
      setOrders(orders.map(order =>
        order._id === orderId
          ? { ...response.data.order }
          : order
      ));

      showToast('Cancellation request submitted successfully', 'success');
    } catch (err) {
      console.error('Error submitting cancellation request:', err);
      showToast(err.response?.data?.message || 'Failed to submit cancellation request', 'error');
    }
  };

  // Reorder all items from an order
  const reorderItems = async (orderItems) => {
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failedCount = 0;

      for (const item of orderItems) {
        try {
          await axios.post(`${BACKEND_URL}/api/cart/add`, {
            productId: item.productId._id,
            quantity: item.quantity
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          successCount++;
        } catch (err) {
          console.error('Error adding item to cart:', err);
          failedCount++;
        }
      }

      if (successCount > 0) {
        showToast(`${successCount} item(s) added to cart successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`, 'success');
      } else {
        showToast('Failed to add items to cart', 'error');
      }
    } catch (err) {
      console.error('Error reordering items:', err);
      showToast('Failed to reorder items', 'error');
    }
  };

  // Reorder single item
  const reorderSingleItem = async (productId, quantity, productName) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/cart/add`, {
        productId: productId,
        quantity: quantity
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showToast(`${productName} added to cart successfully`, 'success');
    } catch (err) {
      console.error('Error reordering item:', err);
      showToast(`Failed to add ${productName} to cart`, 'error');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Processing":
        return <Truck className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "Processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  // Toggle expanded order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Orders</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          </div>
          <p className="text-gray-600">Track and manage your recent purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </h3>
                      </div>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        <span className="text-sm font-medium">{order.orderStatus}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status Progress */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <OrderStatusProgress status={order.orderStatus} createdAt={order.createdAt} />
                </div>

                {/* Order Details */}
                <div className="px-6 py-4">
                  <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span><strong>{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Ordered {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Items ({order.items.length})</h4>
                    <div className="grid gap-3">
                      {order.items.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            {item.productId?.image && (
                              <div className="relative">
                                <img 
                                  src={item.productId.image} 
                                  alt={item.productId?.name || "Product"}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 mb-1">
                                {item.productId?.name || "Product"}
                              </p>
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <span>Qty: {item.quantity}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>₹{item.price.toLocaleString()} each</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-2">
                            <p className="text-lg font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </p>
                            {order.orderStatus === "Delivered" && (
                              <button
                                onClick={() => reorderSingleItem(item.productId._id, item.quantity, item.productId?.name || "Product")}
                                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                title="Reorder this item"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Reorder
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleOrderDetails(order._id)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{expandedOrder === order._id ? 'Hide Details' : 'View Details'}</span>
                    </button>
                    {order.orderStatus === "Delivered" && (
                      <button
                        onClick={() => reorderItems(order.items)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reorder</span>
                      </button>
                    )}
                    {(order.orderStatus === "Placed" || order.orderStatus === "Processing") && !order.cancellationRequested && (
                      <button
                        onClick={() => requestCancellation(order._id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Request Cancellation</span>
                      </button>
                    )}
                    {order.cancellationRequested && (
                      <div className="px-4 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Cancellation {order.cancellationStatus}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details Section */}
                  {expandedOrder === order._id && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-800 mb-4">Order Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Shipping Address</h5>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <p>{order.address?.street}</p>
                            <p>{order.address?.city}, {order.address?.state} {order.address?.zip}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Order Summary</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Payment Method:</span>
                              <span>{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Payment Status:</span>
                              <span className={order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;