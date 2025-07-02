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
    console.log('MONGO_URI:', mongoUri);
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit the process, let the server start without DB
    console.log('Server will start in MOCK MODE (no database connection)');
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
function useMockMode() {
  return mongoose.connection.readyState !== 1;
}

if (!useMockMode()) {
  console.log('USING REAL MONGODB - All data will be persisted.');
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
} else {
  console.log('USING MOCK MODE - No data will be persisted.');
  // Mock endpoints for testing
  app.post('/api/auth/request-pin', (req, res) => {
    const { phone } = req.body;
    console.log('Mock: PIN requested for', phone);
    
    // Special handling for dummy phone number
    if (phone === '+1234567890') {
      console.log('Dummy phone detected - skipping SMS');
      res.json({ success: true, message: 'Mock PIN sent (dummy phone)' });
    } else {
      res.json({ success: true, message: 'Mock PIN sent' });
    }
  });
  
  app.post('/api/auth/verify-pin', (req, res) => {
    const { phone, pin } = req.body;
    console.log('Mock: PIN verification for', phone, 'with PIN', pin);
    
    // Special handling for dummy credentials
    if (phone === '+1234567890' && pin === '1234') {
      console.log('Dummy credentials verified successfully');
      res.json({ 
        success: true, 
        token: 'mock-token-dummy-user',
        user: { phone, isAvailable: false, friends: [] }
      });
    } else {
      res.json({ 
        success: true, 
        token: 'mock-token',
        user: { phone, isAvailable: false, friends: [] }
      });
    }
  });

  // Mock friends endpoints
  app.get('/api/users/friends', (req, res) => {
    console.log('Mock: Fetching friends list');
    // Return mock friends data
    res.json([
      { phone: '+1987654321', isAvailable: true },
      { phone: '+1555123456', isAvailable: false },
      { phone: '+1777888999', isAvailable: true }
    ]);
  });

  app.post('/api/users/availability', (req, res) => {
    const { isAvailable } = req.body;
    console.log('Mock: Updating availability to', isAvailable);
    res.json({ success: true });
  });

  app.post('/api/users/add-friend', (req, res) => {
    const { friendPhone } = req.body;
    console.log('Mock: Adding friend', friendPhone);
    res.json({ success: true });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for origins:', ['https://charbob.github.io', 'https://farewell.earth', 'http://localhost:5173', 'http://localhost:3000']);
  
  // Try to connect to MongoDB
  connectDB();
}); 