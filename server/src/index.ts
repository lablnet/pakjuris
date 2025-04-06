import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import cors from 'cors';
import authRoutes from './apps/user/routes';
import chatRoutes from './apps/chat/routes';

import authMiddleware from './middleware/authMiddleware';
import asyncHandler from './middleware/asyncHandler';

import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler';

const app: Application = express();
const port = process.env.PORT || 8000;

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Public Routes
app.use('/api', authRoutes);

// Routes below this middleware require authentication
app.use(asyncHandler(authMiddleware));
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);

// Database Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

mongoose
  .connect(mongoUri, {
    ssl: true,
    tlsAllowInvalidCertificates: true
  } as ConnectOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));


// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
