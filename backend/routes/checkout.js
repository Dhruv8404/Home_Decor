// routes/checkout.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

console.log('Razorpay instance created with key_id:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');

router.post('/', auth, async (req, res) => {
  const { addressId, paymentMethod } = req.body;

  try {
    console.log('Checkout request received:', { addressId, paymentMethod, userId: req.user.id });

    // Fetch user's addresses
    console.log('Fetching user with ID:', req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user.name, 'with', user.addresses.length, 'addresses');

    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) {
      console.error('Address not found:', addressId);
      return res.status(400).json({ message: 'Address not found' });
    }

    // Fetch cart items
    const cartItems = await Cart.find({ userId: req.user.id }).populate('productId');
    console.log('Cart items found:', cartItems.length);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check if all products exist
    const invalidItems = cartItems.filter(item => !item.productId);
    if (invalidItems.length > 0) {
      console.error('Invalid cart items found:', invalidItems);
      return res.status(400).json({ message: 'Some items in cart are no longer available' });
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
      price: item.productId.price
    }));

    // Create order
    const orderData = {
      userId: req.user.id,
      items: orderItems,
      address: {
        type: address.type,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        isDefault: address.isDefault
      },
      totalAmount,
      paymentMethod: paymentMethod === 'razorpay' ? 'UPI' : paymentMethod
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    let newOrder;
    try {
      newOrder = new Order(orderData);
      await newOrder.save();
      console.log('Order created successfully:', newOrder._id);
    } catch (orderError) {
      console.error('Order creation failed:', orderError);
      return res.status(400).json({ message: 'Failed to create order', error: orderError.message });
    }

    // Optionally, clear cart after order creation
    await Cart.deleteMany({ userId: req.user.id });

    if (paymentMethod === 'razorpay') {
      console.log('Creating Razorpay order for amount:', totalAmount);

      // Create Razorpay order
      const options = {
        amount: Math.round(totalAmount * 100), // amount in paise
        currency: 'INR',
        receipt: `rcpt_${newOrder._id}`,
      };

      try {
        const razorpayOrder = await razorpayInstance.orders.create(options);
        console.log('Razorpay order created:', razorpayOrder.id);

        // Save payment record with status pending
        const payment = new Payment({
          orderId: newOrder._id,
          paymentMethod: 'razorpay',
          amount: totalAmount,
          status: 'pending',
        });
        await payment.save();
        console.log('Payment record saved');

        return res.json({
          message: 'Razorpay order created',
          orderId: newOrder._id,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        });
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        // Delete the order if Razorpay fails
        await Order.findByIdAndDelete(newOrder._id);
        return res.status(500).json({ message: 'Failed to create Razorpay order', error: razorpayError.message });
      }
    } else {
      // For other payment methods, assume payment success
      newOrder.orderStatus = 'Delivered';
      newOrder.paymentStatus = 'Received';
      await newOrder.save();

      const payment = new Payment({
        orderId: newOrder._id,
        paymentMethod,
        amount: totalAmount,
        status: 'completed',
      });
      await payment.save();

      return res.json({ message: 'Order placed successfully', orderId: newOrder._id });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
