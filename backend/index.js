const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import models to register them with Mongoose
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Import routes
const authRoutes = require('./routes/auth');
const seedRoute = require('./routes/seed');
const cartRoutes = require('./routes/cart');
const watchlistRoutes = require('./routes/watchlist');
const addressRoutes = require('./routes/addresses');
const profileRoutes = require('./routes/profile');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, 'uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect routes
console.log('Mounting routes...');
app.use('/api', seedRoute);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Mongoose connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Mongo error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
