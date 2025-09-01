// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: String,
  name: String,
  description: String,
  image: String,
  rating: Number,
  price: Number,
  originalPrice: Number,
  brand: String,
  assembly: String,
  colour: String,
  stock:Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  material: String,
  packContent: String,
  weight: String,
  sku: String
});

module.exports = mongoose.model('Product', productSchema);