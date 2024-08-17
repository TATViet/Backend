const express = require('express');
const app = express();
const User = require('./model/User');
const Product = require('./model/Payment');

app.use(express.json());

// Create a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password });
  await user.save();
  res.json({ message: 'User created successfully' });
});

// Authenticate a user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !user.password === password) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  req.session.user = user;
  res.json({ message: 'Login successful' });
});

// Get the user's cart
app.get('/cart', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const cart = await Cart.find({ userId: user._id });
  res.json(cart);
});

// Add a product to the user's cart
app.post('/cart', async (req, res) => {
  const { productId } = req.body;
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  await Cart.create({ userId: user._id, productId: product._id });
  res.json({ message: 'Product added to cart successfully' });
});

// Delete a product from the user's cart
app.get('/cart/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  await Cart.deleteOne({ userId: user._id, productId: id });
  res.json({ message: 'Product removed from cart successfully' });
});

// Delete all products from the user's cart
app.get('/cart_customer_deletall', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  await Cart.deleteMany({ userId: user._id });
  res.json({ message: 'All products removed from cart successfully' });
});

// Get all products
app.get('/product', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get a specific product
app.get('/product/:id', async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

module.exports = app;