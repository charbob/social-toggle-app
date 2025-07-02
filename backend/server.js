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

// Connect to MongoDB and set up routes accordingly
async function startServer() {
  let usingMock = false;
  let mongoUri = process.env.MONGO_URI;
  if (mongoUri && !/\/[a-zA-Z0-9_-]+\?/.test(mongoUri)) {
    // If no db name, add /socialtoggle before ?
    mongoUri = mongoUri.replace(/(mongodb\+srv:\/\/[^\/]+)(\/?)(\?.*)/, '$1/socialtoggle$3');
    console.log('Adjusted MONGO_URI to include db name:', mongoUri);
  }
  try {
    console.log('MONGO_URI:', mongoUri);
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    usingMock = false;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Server will start in MOCK MODE (no database connection)');
    usingMock = true;
  }

  if (!usingMock) {
    console.log('USING REAL MONGODB - All data will be persisted.');
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('CORS enabled for origins:', ['https://charbob.github.io', 'https://farewell.earth', 'http://localhost:5173', 'http://localhost:3000']);
    if (!usingMock) {
      console.log('Backend is LIVE and connected to MongoDB!');
    }
  });
}

startServer(); 