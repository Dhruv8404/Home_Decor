const express = require('express');
const { getUsers, getProducts, createProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, updateCancellationStatus, uploadProductImage } = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Multer configuration for product image uploads
const productUploadDir = path.join(__dirname, '../uploads/products');
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (req, file, cb) => {
    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (JPEG, JPG, PNG, WEBP)!'));
    }
  }
});

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
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/upload-image', productUpload.single('productImage'), uploadProductImage);
router.get('/orders', getOrders);

// Update order status (cancel, deliver, etc.)
router.put('/orders/:orderId/status', updateOrderStatus);

// Handle cancellation requests
router.put('/orders/:orderId/cancellation/approve', updateCancellationStatus);
router.put('/orders/:orderId/cancellation/reject', updateCancellationStatus);

module.exports = router;

