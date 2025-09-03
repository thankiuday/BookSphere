const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import configuration
const { config, validateConfig } = require('./config/env');

const app = express();
const PORT = config.server.port;

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const chatRoutes = require('./routes/chat');

// Security middleware
app.use(helmet());
// Behind Render/Proxies
app.set('trust proxy', 1);

// Rate limiting - optimized for Render free tier
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Reduced for free tier
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (config.server.nodeEnv === 'production')
      ? [process.env.FRONTEND_URL].filter(Boolean)
      : Array.isArray(config.frontend.url) ? config.frontend.url : [config.frontend.url];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint - optimized for Render
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BookSphere API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv
  });
});

// Root endpoint for Render health checks
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BookSphere API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

        // Serve static files from Vite build in production
        if (config.server.nodeEnv === 'production') {
          app.use(express.static(path.join(__dirname, '../frontend/dist')));
          
          // Handle React routing, return all requests to React app
          app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
          });
        }

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.server.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Validate configuration before starting server
if (!validateConfig()) {
  console.error('❌ Server startup failed due to configuration errors');
  process.exit(1);
}

// Database connection
mongoose.connect(config.mongodb.uri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 BookSphere API ready for global authors and readers`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
