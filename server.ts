import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import {
  errorHandler,
  handle404,
  jsonParseErrorHandler,
  extendResponse,
  AppResponse,
} from './middleware/error';

import authRoutes  from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

// ─── DB ───────────────────────────────────────────────────────────────────────

async function connectDB(): Promise<void> {
  const uri =
    process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD!
      : process.env.MONGODB_URI!;
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);
}

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(jsonParseErrorHandler);
app.use(extendResponse);
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  (res as AppResponse).data(
    { status: 'OK', env: process.env.NODE_ENV, uptime: process.uptime() },
    'Server is healthy'
  );
});

app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use('*', handle404);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  ✅  NURTW Server running
  Env:  ${process.env.NODE_ENV}
  Port: ${PORT}
  Time: ${new Date().toLocaleTimeString()}
  `);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION — shutting down:', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: Error) => {
  console.log('UNCAUGHT EXCEPTION — shutting down:', err.name, err.message);
  process.exit(1);
});

export default app;
