const express = require('express');
const { getUsers, getProducts, getOrders } = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Admin dashboard
router.get('/', (req, res) => {
  res.json({ 
    message: 'Admin Dashboard', 
    user: req.user 
  });
});

// Admin routes for managing users, products, and orders
router.get('/users', getUsers);
router.get('/products', getProducts);
router.get('/orders', getOrders);

module.exports = router;

