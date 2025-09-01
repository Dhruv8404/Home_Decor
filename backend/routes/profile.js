//

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const path = require('path');
const multer = require('multer');

// Set upload directory
const uploadDir = path.join(__dirname, '../uploads/profile-images');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user || !req.user.id) {
      return cb(new Error('User ID not found'));
    }
    const filename = `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (JPEG, JPG, PNG)!'));
    }
  }
});

// Upload image route
router.post('/upload-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Save relative path (relative to project root)
    const relativePath = path.relative(path.join(__dirname, '../'), req.file.path).replace(/\\/g, '/');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: relativePath },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Error uploading image' });
  }
});

// Get profile route
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update profile info
router.put('/', auth, async (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;