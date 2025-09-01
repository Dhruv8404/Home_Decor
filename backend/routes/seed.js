// routes/products.js
const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Fetch products by category
router.get('/products', async (req, res) => {
  const category = req.query.category; // get category from query param
  try {
    const filter = category ? { category } : {}; // if category exists, filter by it
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;