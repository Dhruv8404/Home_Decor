// components/OrderConfirmation.js
import React from 'react';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

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

export default OrderConfirmation;