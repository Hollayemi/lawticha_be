import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/database';
import {
  errorHandler,
  handle404,
  // jsonParseErrorHandler,
  extendResponse,
} from './middleware/error';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

//  Security 
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

//  Core middleware 
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000' || "https://lawticha.vercel.app" ,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// app.use(jsonParseErrorHandler);
app.use(extendResponse);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

//  Health check 
app.get('/health', (_req, res) => {
  (res as any).data(
    {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
    },
    'Server is healthy'
  );
});

//  Route imports 

import learnRoutes from './routes/learn.routes';
import communityRoutes from './routes/community.routes';

// Legacy LawTicha auth (keep if still needed)
import authRoutes from './routes/auth.routes';
import citizenRoutes from './routes/citizen.routes';
// import adminRoutes       from './routes/admin.routes';

// LawTicha admin
import adminAuthRoutes from './routes/admin/auth.admin.routes';
import adminCitizenRoutes from './routes/admin/citizen.admin.routes';
import lawyerRoutes from './routes/admin/lawyer.admin.routes';
import modulesRoutes from './routes/admin/module.admin.routes';
import adminRoutes from './routes/admin/admin.routes';
// import { seedAdmin } from './scripts/seed-super-admin';


// Public
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/community', communityRoutes);


// Legacy LawTicha
app.use('/api/v1/auth/admin', adminAuthRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/citizen', citizenRoutes);

// LawTicha Admin Resource Routes
app.use('/api/v1/admin/citizens', adminCitizenRoutes);
app.use('/api/v1/admin/lawyers', lawyerRoutes);
app.use('/api/v1/admin/modules', modulesRoutes);

//  Error handling 
app.use('*', handle404);
app.use(errorHandler);

// seedAdmin()

//  Start 
const server = app.listen(PORT, () => {
  console.log(`
    LawTicha Server Running
    Environment: ${process.env.NODE_ENV}
    Port:        ${PORT}
    Time:        ${new Date().toLocaleTimeString()}
  `);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: Error) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

export default app;
