const express = require('express');
const Watchlist = require('../models/Watchlist');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/add', auth, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    // Check if product is already in watchlist
    const exists = await Watchlist.findOne({ userId, productId });
    if (exists) {
      return res.status(400).json({ message: 'Product already in watchlist' });
    }

    const newEntry = new Watchlist({ userId, productId });
    await newEntry.save();
    res.json({ message: 'Product added to watchlist', item: newEntry });
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});


// DELETE /api/watchlist/remove
router.delete('/remove', auth, async (req, res) => {
  const { productId } = req.body;

  try {
    await Watchlist.deleteOne({ userId: req.user.id, productId });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// routes/watchlist.js


// GET /api/watchlist - Get user's watchlist with product details
router.get('/', auth, async (req, res) => {
  try {
    const watchlistItems = await Watchlist.find({ userId: req.user.id })
      .sort({ addedAt: -1 }) // Sort by most recently added first
      .populate('productId'); // Populate the product detail
    res.json(watchlistItems);
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});


module.exports = router;