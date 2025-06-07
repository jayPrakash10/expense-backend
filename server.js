require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.DB_URI || process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { dbName: 'expense' })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Expense Management API' });
});

// Signup routes
const signupRoutes = require('./routes/signupRoutes');
app.use('/signup', signupRoutes);

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// User routes
const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);

// Category routes
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/categories', categoryRoutes);

// Subcategory routes
const subcategoryRoutes = require('./routes/subcategoryRoutes');
app.use('/subcategories', subcategoryRoutes);

// Expense routes
const expenseRoutes = require('./routes/expenseRoutes');
app.use('/expenses', expenseRoutes);

// User Settings routes
const userSettingsRoutes = require('./routes/userSettingsRoutes');
app.use('/settings', userSettingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
