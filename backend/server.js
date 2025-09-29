const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Nodemailer transporter (will be configured later)
let transporter;

// Load environment variables
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const routes = require('./routes');

// Import error handler
const errorHandler = require('./middleware/error');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Body parser middleware - MUST be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
// Prevent http param pollution
app.use(hpp());

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      console.error('CORS Error:', msg);
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Enable CORS with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Mount routers
app.use('/api/v1', routes);

// Error handler
app.use(errorHandler);

// Ensure the public/uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set static folder - must be before body parser
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount API routes
app.use('/api/v1', routes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Handle 404 - Not Found
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize nodemailer
transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = server;

async function generateQrCodeURL(data) {
  try {
    const dataUri = await qrcode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 1,
      color: {
        dark: "#2D3748",
        light: "#FFFFFF",
      },
    });

    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: "qr_codes_GarbaGravity"
    });
    
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Error generating QR code URL:', error);
    throw error;
  }
}

async function sendNodemailerEmail(recipient, subject, htmlBody) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipient,
    subject: subject,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
app.post("/generate-qr", async (req, res) => {
  const { emailId, name } = req.body;

  if (!emailId || !name) {
    return res
      .status(400)
      .json({ error: 'Missing required fields:  "name", or "emailId".' });
  }

  // Validate emailId for sending
  if (!emailId.includes("@")) {
    return res.status(400).json({ error: "Invalid recipient emailId format." });
  }

  const pass_url = `https://garbaGravity.com/user/${emailId}`;

  try {
    const qrDataUri = await generateQrCodeURL(pass_url);

    const htmlContent = getHtmlTemplate(qrDataUri, pass_url, name);

    const nodemailerRes = await sendNodemailerEmail(
      emailId,
      EMAIL_SUBJECT,
      htmlContent
    );

    res.status(200).json({
      status: "success",
      message: `Digital pass successfully generated and sent to ${emailId} for user ${name}.`,
      qr_data_encoded: pass_url,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to generate or send the pass.",
      details: error.message || error.message,
    });
  }
});
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
