const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// More comprehensive CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://charbob.github.io',
      'https://farewell.earth',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Connect to MongoDB with better error handling
async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost/socialtoggle';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit the process, let the server start without DB
    console.log('Server will start without database connection');
  }
}

// Start the server even if MongoDB fails
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'SocialToggleApp backend is running',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1,
    corsEnabled: true
  });
});

// Only load routes if MongoDB is connected
if (mongoose.connection.readyState === 1) {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
} else {
  // Mock endpoints for testing
  app.post('/api/auth/request-pin', (req, res) => {
    console.log('Mock: PIN requested for', req.body.phone);
    res.json({ success: true, message: 'Mock PIN sent' });
  });
  
  app.post('/api/auth/verify-pin', (req, res) => {
    console.log('Mock: PIN verified for', req.body.phone);
    res.json({ 
      success: true, 
      token: 'mock-token',
      user: { phone: req.body.phone, isAvailable: false, friends: [] }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for origins:', ['https://charbob.github.io', 'https://farewell.earth', 'http://localhost:5173', 'http://localhost:3000']);
  
  // Try to connect to MongoDB
  connectDB();
}); 