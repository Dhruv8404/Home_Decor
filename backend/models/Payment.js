// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  paymentMethod: String,
  amount: Number,
  paidAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' } // Pending, Failed, Completed
});

module.exports = mongoose.model('Payment', PaymentSchema);