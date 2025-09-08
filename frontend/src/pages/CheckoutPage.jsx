import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, User, ShoppingCart, Plus, Minus, Trash2, Package, Truck, Home } from 'lucide-react';
import axios from 'axios';

const OrderConfirmation = ({ orderId, onContinueShopping }) => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
      <p className="text-gray-600 mb-6">Thank you for your order. Your order ID is: <span className="font-semibold">{orderId}</span></p>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-500 mr-3" />
            <span>We're preparing your order for shipment</span>
          </div>
          <div className="flex items-center">
            <Truck className="w-5 h-5 text-blue-500 mr-3" />
            <span>You'll receive updates about your delivery</span>
          </div>
          <div className="flex items-center">
            <Home className="w-5 h-5 text-blue-500 mr-3" />
            <span>Please keep cash ready for delivery</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onContinueShopping}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition"
      >
        Continue Shopping
      </button>
    </div>
  );
};

const CheckoutPage = () => {
  const token = localStorage.getItem('token');

  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [updating, setUpdating] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Totals
  const [subtotalWithDiscount, setSubtotalWithDiscount] = useState(0);
  const [subtotalWithoutDiscount, setSubtotalWithoutDiscount] = useState(0);
  const [savings, setSavings] = useState(0);
  const [total, setTotal] = useState(0);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (!token) {
      setError('Please log in to proceed.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [resProfile, resAddresses, resCart] = await Promise.all([
          axios.get('http://localhost:5000/api/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/addresses', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/cart', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUser(resProfile.data);
        const addrData = resAddresses.data;
        setAddresses(addrData);
        const defaultAddr = addrData.find(addr => addr.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
        else if (addrData.length > 0) setSelectedAddressId(addrData[0]._id);
        const items = resCart.data.items || [];
        setOrderItems(items);

        // Calculate totals
        const sumPrice = items.reduce(
          (sum, item) => sum + item.productId.price * item.quantity,
          0
        );
        const sumOriginalPrice = items.reduce(
          (sum, item) => sum + item.productId.originalPrice * item.quantity,
          0
        );
        const calcSavings = sumOriginalPrice - sumPrice;

        setSubtotalWithDiscount(sumPrice);
        setSubtotalWithoutDiscount(sumOriginalPrice);
        setSavings(calcSavings);
        setTotal(sumPrice);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleAddressSelect = (id) => setSelectedAddressId(id);

  const handleUpdateQuantity = async (itemId, newQty, stock) => {
    if (newQty < 1 || newQty > stock) return;
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await axios.patch(`http://localhost:5000/api/cart/${itemId}`, { quantity: newQty }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedItems = orderItems.map(item =>
        item._id === itemId ? { ...item, quantity: newQty } : item
      );
      setOrderItems(updatedItems);
      // Recalculate totals
      const sumPrice = updatedItems.reduce(
        (sum, item) => sum + item.productId.price * item.quantity,
        0
      );
      const sumOriginalPrice = updatedItems.reduce(
        (sum, item) => sum + item.productId.originalPrice * item.quantity,
        0
      );
      const calcSavings = sumOriginalPrice - sumPrice;

      setSubtotalWithDiscount(sumPrice);
      setSubtotalWithoutDiscount(sumOriginalPrice);
      setSavings(calcSavings);
      setTotal(sumPrice);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDeleteItem = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await axios.delete(`http://localhost:5000/api/cart/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const remainingItems = orderItems.filter(item => item._id !== itemId);
      setOrderItems(remainingItems);
      // Recalculate totals
      const sumPrice = remainingItems.reduce(
        (sum, item) => sum + item.productId.price * item.quantity,
        0
      );
      const sumOriginalPrice = remainingItems.reduce(
        (sum, item) => sum + item.productId.originalPrice * item.quantity,
        0
      );
      const calcSavings = sumOriginalPrice - sumPrice;

      setSubtotalWithDiscount(sumPrice);
      setSubtotalWithoutDiscount(sumOriginalPrice);
      setSavings(calcSavings);
      setTotal(sumPrice);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

 const handlePayment = async () => {
  if (!selectedAddressId || orderItems.length === 0) {
    alert('Please select an address and have items in cart.');
    return;
  }

  if (paymentMethod === 'cod') {
    setProcessing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/orders/cod', {
        addressId: selectedAddressId,
        items: orderItems.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.price
        })),
        totalAmount: total,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show success message
      setOrderSuccess(true);
      setOrderId(response.data.orderId);

      // Clear cart items after order success
      for (const item of orderItems) {
        await axios.delete(`http://localhost:5000/api/cart/${item._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

    } catch (error) {
      console.error('COD payment error:', error);
      alert('Error processing COD payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  } else if (paymentMethod === 'upi') {
    setProcessing(true);
    try {
      // Create order and get Razorpay order details
      const response = await axios.post('http://localhost:5000/api/checkout', {
        addressId: selectedAddressId,
        paymentMethod: 'razorpay',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { razorpayOrderId, amount, currency, orderId } = response.data;

      const options = {
        key: 'rzp_test_hf54kCj6NjigUj', // Your Razorpay Key ID
        amount: amount,
        currency: currency,
        name: 'Home Decor',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Verify payment on backend
          try {
            const verifyResponse = await axios.post('http://localhost:5000/api/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyResponse.data.success) {
              setOrderSuccess(true);
              setOrderId(orderId);

              // Clear cart items after order success
              for (const item of orderItems) {
                await axios.delete(`http://localhost:5000/api/cart/${item._id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
              }
            } else {
              alert('Payment verification failed. Please try again.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Error verifying payment. Please try again.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('UPI payment error:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  }
};


  if (orderSuccess) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <OrderConfirmation 
          orderId={orderId} 
          onContinueShopping={() => window.location.href = '/'}
        />
      </div>
    );
  }

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="p-6 bg-red-100 text-red-700">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen flex flex-col space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4">
        <MapPin className="w-8 h-8 text-blue-600" /> Checkout
      </h1>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 flex-1">

        {/* Left: Cart & Address */}
        <div className="md:w-2/3 bg-white rounded-lg shadow p-6 space-y-6 max-h-[calc(100vh-100px)] overflow-y-auto">
          
          {/* User Details */}
          <div className="border-b pb-4 mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-2">
              <User className="w-5 h-5 text-gray-700" /> Your Details
            </h2>
            <div className="text-gray-700">
              <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="border-b pb-4 mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
              <MapPin className="w-5 h-5 text-gray-700" /> Addresses
            </h2>
            {addresses.length === 0 ? (
              <p className="text-gray-500">No addresses added.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {addresses.map(addr => (
                  <div
                    key={addr._id}
                    className={`cursor-pointer p-3 rounded-lg border ${addr._id === selectedAddressId ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                    onClick={() => handleAddressSelect(addr._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{addr.type}</p>
                        <p className="text-sm text-gray-600">{addr.street}, {addr.city}, {addr.state} {addr.zip}</p>
                        {addr.isDefault && (
                          <div className="text-green-600 text-xs flex items-center mt-1">
                            <CheckCircle className="w-4 h-4 mr-1" /> Default
                          </div>
                        )}
                      </div>
                      {addr._id === selectedAddressId && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-3">
              <ShoppingCart className="w-5 h-5 text-gray-700" /> Your Cart
            </h2>
            {orderItems.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => {
                  const product = item.productId;
                  const maxStock = product.stock;
                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border shadow-sm">
                      <div className="flex items-center gap-3 w-full">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => { e.target.src='https://via.placeholder.com/150x150?text=No+Image'; }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            {/* Quantity controls */}
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1, maxStock)}
                              disabled={item.quantity <= 1 || updating[item._id]}
                              className="p-1 border rounded disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1, maxStock)}
                              disabled={item.quantity >= maxStock || updating[item._id]}
                              className="p-1 border rounded disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">
                            ₹{(product.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        disabled={updating[item._id]}
                        className="text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary & Payment */}
        <div className="md:w-1/3 bg-white rounded-lg shadow p-6 space-y-6 sticky top-6 overflow-hidden max-h-[calc(100vh-100px)]">
          {/* Summary Card */}
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
              <ShoppingCart className="w-5 h-5 text-gray-700" /> Summary
            </h2>
            {/* Subtotal after discount */}
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal (after discount)</span>
              <span>₹{(subtotalWithDiscount).toLocaleString()}</span>
            </div>
            {/* Subtotal without discount */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal (without discount)</span>
              <span className="text-gray-600">₹{(subtotalWithoutDiscount).toLocaleString()}</span>
            </div>
            {/* Savings */}
            {savings > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span className="font-medium">You Save</span>
                <span>-₹{(savings).toLocaleString()}</span>
              </div>
            )}
            {/* Total */}
            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
              <span>Total Payable</span>
              <span>₹{(total).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center text-gray-600 mb-4">
            <CheckCircle className="w-4 h-4 mr-2" /> Secure checkout with SSL
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
            <div className="flex flex-col space-y-2">
              {/* UPI / Wallets */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="accent-blue-600"
                />
                <span>UPI / Wallets</span>
              </label>
              {/* Cash on Delivery */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-blue-600"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <button
            onClick={handlePayment}
            disabled={!selectedAddressId || orderItems.length === 0 || processing}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;