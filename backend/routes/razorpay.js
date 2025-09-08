// routes/razorpay.js
const express = require('express');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay instance with environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Route to create Razorpay order
router.post('/create-order', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: currency || 'INR',
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpayInstance.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ message: 'Error creating Razorpay order' });
  }
});

// Verify payment and update order status
router.post('/verify', async (req, res) => {
  const crypto = require('crypto');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment verified successfully
      // Update order status and payment record
      const Order = require('../models/Order');
      const Payment = require('../models/Payment');

      // Find order by razorpay order id (assuming receipt is rcpt_orderId)
      const order = await Order.findOne({ _id: razorpay_order_id.split('_')[1] });

      if (order) {
        order.orderStatus = 'Delivered';
        order.paymentStatus = 'Received';
        await order.save();

        // Update payment record
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment) {
          payment.status = 'completed';
          await payment.save();
        }
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.json({ success: false, message: 'Payment verification failed' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

module.exports = router;