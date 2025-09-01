// routes/checkout.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

router.post('/', auth, async (req, res) => {
  const { addressId, paymentMethod } = req.body;

  try {
    // Fetch user's addresses
    const user = await User.findById(req.user.id);
    const address = user.addresses.find(addr => addr._id.toString() === addressId);

    if (!address) {
      return res.status(400).json({ message: 'Address not found' });
    }

    // Fetch cart items
    const cartItems = await Cart.find({ userId: req.user.id }).populate('productId');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    // Prepare order items
    const orderItems = cartItems.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      priceAtPurchase: item.productId.price
    }));

    // Create order
    const newOrder = new Order({
      userId: req.user.id,
      items: orderItems,
      address: address,
      totalAmount
    });

    await newOrder.save();

    // Optionally, clear cart after order creation
    await Cart.deleteMany({ userId: req.user.id });

    // Handle payment process here (integrate with payment gateway)
    // For now, assume payment is successful

    // Update order status
    newOrder.status = 'Paid';
    await newOrder.save();

    res.json({ message: 'Order placed successfully', orderId: newOrder._id });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;