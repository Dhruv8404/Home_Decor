// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get token from localStorage (or context if you store it differently)
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) return <p className="text-center mt-10">Loading orders...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Orders</h2>

      {orders.length === 0 ? (
        <p className="text-gray-600">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              {/* Order Header */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h3>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    order.orderStatus === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : order.orderStatus === "Cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              {/* Order Details */}
              <p className="text-sm text-gray-600">
                Payment: <b>{order.paymentMethod}</b> ({order.paymentStatus})
              </p>
              <p className="text-sm text-gray-600">
                Total: <b>₹{order.totalAmount}</b>
              </p>
              <p className="text-sm text-gray-500">
                Placed on: {new Date(order.createdAt).toLocaleString()}
              </p>

              {/* Items */}
              <div className="mt-3">
                <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {item.productId?.image && (
                          <img 
                            src={item.productId.image} 
                            alt={item.productId?.name || "Product"}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.productId?.name || "Product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        ₹{item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
