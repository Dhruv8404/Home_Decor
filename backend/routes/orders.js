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
    const order = await Order.findByIdAndUpdate(orderId, { orderStatus: 'Cancelled' }, { new: true });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
  }
});
module.exports = router;
