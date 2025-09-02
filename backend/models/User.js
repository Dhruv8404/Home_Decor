const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Not provided'
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    default: 'Not provided'
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  addresses: [{
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
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['Visa', 'MasterCard', 'Amex', 'Discover'],
      required: true
    },
    last4: String,
    expiry: String
  }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  role: {
    type: String,
    enum: ['Student', 'Teacher', 'Admin'],
    default: 'Student'
  },
  profile: {
    studentId: String,
    employeeId: String,
    branch: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);