//routes/addresses.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Add new address
router.post('/', auth, async (req, res) => {
  const { type, street, city, state, zip, isDefault } = req.body;
  if (!type || !street || !city || !state || !zip) {
    return res.status(400).json({ message: 'All address fields are required' });
  }
  try {
    const user = await User.findById(req.user.id);

    // If setting as default, unset previous default
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({ type, street, city, state, zip, isDefault });
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all addresses
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set default address
router.put('/:addressId/default', auth, async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    user.addresses.forEach(addr => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
      } else {
        addr.isDefault = false;
      }
    });
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete address
router.delete('/:addressId', auth, async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;