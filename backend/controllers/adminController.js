const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    // Fetch orders and populate user information
    const orders = await Order.find()
      .populate('userId', 'name email') // Populate user name and email
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
};

module.exports = {
  getUsers,
  getProducts,
  getOrders
};
