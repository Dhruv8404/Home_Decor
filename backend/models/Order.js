const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  address: {
    type: {
      type: String,
      enum: ['Shipping', 'Billing'],
      required: true
    },
    street: String,
    city: String,
    state: String,
    zip: String,
    isDefault: Boolean
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'UPI', 'Card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Received', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  cancellationRequested: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancellationStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: null
  },
  cancellationRequestedAt: {
    type: Date
  },
  cancellationApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationApprovedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);