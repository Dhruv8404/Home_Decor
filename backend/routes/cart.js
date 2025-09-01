const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.user.id }).populate('productId');
    console.log('Fetched cartItems:', cartItems); // Debug log
    res.json({ items: cartItems });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  const { productId, quantity } = req.body;
  
  try {
    let cartItem = await Cart.findOne({ userId: req.user.id, productId });
    
    if (cartItem) {
      cartItem.quantity += quantity || 1;
    } else {
      cartItem = new Cart({
        userId: req.user.id,
        productId,
        quantity: quantity || 1
      });
    }
    
    await cartItem.save();
    res.json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update cart item quantity
router.patch('/:id', auth, async (req, res) => {
  try {
    const cartItem = await Cart.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { quantity: req.body.quantity },
      { new: true }
    );
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    res.json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.delete('/:id', auth, async (req, res) => {
  try {
    const cartItem = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    res.json({ message: 'Cart item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
