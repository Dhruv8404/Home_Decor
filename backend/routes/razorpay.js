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

// Optional: add verification route if needed
router.post('/verify', (req, res) => {
  const crypto = require('crypto');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;