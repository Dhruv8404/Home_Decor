const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const path = require('path');
const multer = require('multer');

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

// Create a new product
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const newProduct = new Product(productData);
    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
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

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`[DEBUG] updateOrderStatus called with orderId: ${orderId}, status: ${status}`);

    if (!['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    let order;
    try {
      order = await Order.findById(orderId).populate('items.productId');
      console.log(`[DEBUG] Populate query executed successfully`);
    } catch (populateError) {
      console.error(`[DEBUG] Populate query failed:`, populateError);
      return res.status(500).json({ message: 'Database query error', error: populateError.message });
    }

    if (!order) {
      console.log(`[DEBUG] Order not found: ${orderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`[DEBUG] Order found:`, {
      orderId: order._id,
      currentStatus: order.orderStatus,
      itemsCount: order.items.length,
      items: order.items.map(item => ({
        productId: item.productId?._id,
        productName: item.productId?.name,
        quantity: item.quantity,
        currentStock: item.productId?.stock,
        productExists: !!item.productId
      }))
    });

    const previousStatus = order.orderStatus;

    // If status is changing to Delivered and wasn't previously Delivered, update stock
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      console.log(`Processing delivery for order ${orderId} - updating stock`);

      // Check stock availability first
      for (const item of order.items) {
        const product = item.productId;
        if (!product) {
          return res.status(400).json({ message: `Product not found for item in order` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`
          });
        }
      }

      // Update stock for all products
      for (const item of order.items) {
        const product = item.productId;
        const oldStock = product.stock;
        product.stock -= item.quantity;

        try {
          await product.save();
          console.log(`Updated stock for ${product.name}: ${oldStock} -> ${product.stock}`);
        } catch (saveError) {
          console.error(`[ERROR] Failed to save stock update for ${product.name}:`, saveError);
          return res.status(500).json({
            message: `Failed to update stock for ${product.name}`,
            error: saveError.message
          });
        }
      }
      console.log(`Stock update completed for order ${orderId}`);
    }

    // If status is changing from Delivered to something else, restore stock
    if (previousStatus === 'Delivered' && status !== 'Delivered') {
      console.log(`Restoring stock for order ${orderId} - status changed from Delivered to ${status}`);

      for (const item of order.items) {
        const product = item.productId;
        if (product) {
          const oldStock = product.stock;
          product.stock += item.quantity;

          try {
            await product.save();
            console.log(`Restored stock for ${product.name}: ${oldStock} -> ${product.stock}`);
          } catch (restoreError) {
            console.error(`[ERROR] Failed to restore stock for ${product.name}:`, restoreError);
            return res.status(500).json({
              message: `Failed to restore stock for ${product.name}`,
              error: restoreError.message
            });
          }
        }
      }
      console.log(`Stock restoration completed for order ${orderId}`);
    }

    // Save order status update (only update the status field to avoid validation issues)
    try {
      await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true, runValidators: false });
      console.log(`Order status updated to ${status}`);
    } catch (orderSaveError) {
      console.error(`[ERROR] Failed to save order status update:`, orderSaveError);
      return res.status(500).json({
        message: 'Failed to update order status',
        error: orderSaveError.message
      });
    }

    // Verify stock updates were saved to database
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      console.log('Verifying stock updates in database...');
      try {
        for (const item of order.items) {
          const product = item.productId;
          if (product) {
            const updatedProduct = await Product.findById(product._id);
            console.log(`Verified ${product.name} stock in DB: ${updatedProduct.stock}`);
          }
        }
      } catch (verifyError) {
        console.error(`[ERROR] Failed to verify stock updates:`, verifyError);
        // Don't return error here, just log it - the main operation succeeded
      }
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

// Upload product image
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Save relative path (relative to project root)
    const relativePath = path.relative(path.join(__dirname, '../'), req.file.path).replace(/\\/g, '/');

    res.json({ message: 'Image uploaded successfully', imageUrl: relativePath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Error uploading image' });
  }
};

// Handle cancellation request approval/rejection
const updateCancellationStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const action = req.path.includes('approve') ? 'Approved' : 'Rejected';
    const adminId = req.user.id;

    console.log(`[DEBUG] updateCancellationStatus called with orderId: ${orderId}, action: ${action}`);

    // First check if order exists and has pending cancellation request
    const order = await Order.findById(orderId).populate('items.productId');

    if (!order) {
      console.log(`[DEBUG] Order not found: ${orderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.cancellationRequested || order.cancellationStatus !== 'Pending') {
      return res.status(400).json({ message: 'No pending cancellation request for this order' });
    }

    const updateData = {
      cancellationStatus: action,
      cancellationApprovedBy: adminId,
      cancellationApprovedAt: new Date()
    };

    // If approved, update order status to Cancelled and handle stock restoration
    if (action === 'Approved') {
      const previousStatus = order.orderStatus;

      // If order was already delivered, restore stock
      if (previousStatus === 'Delivered') {
        console.log(`Restoring stock for cancelled order ${orderId}`);

        for (const item of order.items) {
          const product = item.productId;
          if (product) {
            const oldStock = product.stock;
            product.stock += item.quantity;

            try {
              await product.save();
              console.log(`Restored stock for ${product.name}: ${oldStock} -> ${product.stock}`);
            } catch (restoreError) {
              console.error(`[ERROR] Failed to restore stock for ${product.name}:`, restoreError);
              return res.status(500).json({
                message: `Failed to restore stock for ${product.name}`,
                error: restoreError.message
              });
            }
          }
        }
      }

      // Update order status to Cancelled and payment status
      updateData.orderStatus = 'Cancelled';
      if (order.paymentStatus === 'Received') {
        updateData.paymentStatus = 'Refunded';
      }
    }

    // Use findByIdAndUpdate to avoid full document validation
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: false }
    ).populate('items.productId');

    res.json({
      message: `Cancellation request ${action.toLowerCase()}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update cancellation status error:', error);
    res.status(500).json({ message: 'Failed to update cancellation status' });
  }
};

module.exports = {
  getUsers,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  updateCancellationStatus,
  uploadProductImage
};
