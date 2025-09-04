const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User'); // Import User model
const { auth } = require('../middleware/auth');

const router = express.Router();

// Simple COD order creation
// routes/orders.js
router.post('/cod', auth, async (req, res) => {
  try {
    const { addressId, items, totalAmount } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const selectedAddress = user.addresses.id(addressId); // find subdocument

    if (!selectedAddress) {
      return res.status(400).json({ message: 'Invalid address' });
    }

    const order = new Order({
      userId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      address: selectedAddress.toObject(), // embed address
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Placed"
    });

    await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// routes/orders.js
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId') // still valid
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndUpdate(orderId, { orderStatus: 'Processing' }, { new: true });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order confirmed', order });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;

    // First check if order exists and can be cancelled
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.cancellationRequested) {
      return res.status(400).json({ message: 'Cancellation request already submitted' });
    }

    // Only allow cancellation if order is not already cancelled or delivered
    if (order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: `Cannot cancel an order that is ${order.orderStatus}` });
    }

    // Use findByIdAndUpdate to avoid full document validation
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        cancellationRequested: true,
        cancellationReason: reason || '',
        cancellationStatus: 'Pending',
        cancellationRequestedAt: new Date()
      },
      { new: true, runValidators: false } // Skip validation to avoid address validation issues
    );

    res.json({ message: 'Cancellation request submitted', order: updatedOrder });
  } catch (error) {
    console.error('Error submitting cancellation request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
