import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http';
import { ChatService }    from './services/chat-service/services/ChatService';
import { createChatRouter } from './services/chat-service/router/chat.router';

import connectDB from './config/database';
import {
  errorHandler,
  handle404,
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

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000' || "https://lawticha.vercel.app" ,
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
import otherRoutes from './routes/others.routes';
import communityRoutes from './routes/community.routes';
import dashboardRoutes from './routes/dashboard.routes'

// Legacy LawTicha auth (keep if still needed)
import libraryRoutes from './routes/library.routes';
import authRoutes from './routes/auth.routes';
import citizenRoutes from './routes/citizen.routes';
import lawyerRoutes from './routes/lawyer.routes';
import paymentRoutes from './routes/payment.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import consultationRoutes from './routes/consultation.routes';

// LawTicha admin
// import adminRoutes       from './routes/admin.routes';
import adminAuthRoutes from './routes/admin/auth.admin.routes';
import adminCitizenRoutes from './routes/admin/citizen.admin.routes';
import adminCommunityRoutes from './routes/admin/community.admin.routes';
import adminLibraryRoutes from './routes/admin/library.admin.routes';
import adminLawyerRoutes from './routes/admin/lawyer.admin.routes';
import modulesRoutes from './routes/admin/module.admin.routes';
import adminRoutes from './routes/admin/admin.routes';
import adminDashboardRoutes from './routes/admin/dashboard.admin.routes';
import adminConsultation from './routes/admin/consultation.admin.routes';
import { seedSpecialisms } from './scripts/seed-specialism';
import { protectBoth } from './middleware/auth.middleware';



// auth
app.use('/api/v1/auth/admin', adminAuthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payment', paymentRoutes);


// Mount the routes (adjust base path as needed)
// Public
app.use('/api/v1', otherRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/learn', learnRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/marketplace', lawyerRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/citizen', citizenRoutes);

// Legacy LawTicha
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/community', adminCommunityRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/admin/citizens', adminCitizenRoutes);
app.use('/api/v1/admin/library', adminLibraryRoutes);
app.use('/api/v1/admin/lawyers', adminLawyerRoutes);
app.use('/api/v1/admin/modules', modulesRoutes);
app.use('/api/v1/admin/consultations', adminConsultation);


// ── Create HTTP server (required for Socket.io) ──────────────────────────────
const httpServer = http.createServer(app);
 
// ── Initialise ChatService ────────────────────────────────────────────────────
export const chatService = new ChatService(httpServer, {
  redisUrl:    process.env.REDIS_URL ?? 'rediss://default:gQAAAAAAAk6vAAIgcDIyZmM5ZTVhMTE1MWE0ZGJlODgwMDQ1OTljYTE1ZjkwNw@harmless-swine-151215.upstash.io:6379',
  jwtSecret:   process.env.JWT_SECRET,
  corsOrigins: process.env.CLIENT_URL ?? 'http://localhost:3000',
  presenceTtlSeconds:  30,
  heartbeatIntervalMs: 20_000,
  messagesPageSize:    50,
});

app.use('/api/v1/chat', protectBoth, createChatRouter(chatService));


//  Error handling 
app.use('*', handle404);
app.use(errorHandler);

// seedSpecialisms()
//  Start 
const server = httpServer.listen(PORT, async () => {
  await chatService.init();
  console.log(`
    LawTicha Server Running
    Environment: ${process.env.NODE_ENV}
    Port:        ${PORT}
    Time:        ${new Date().toLocaleTimeString()}
  `);
});

// httpServer.listen(PORT, async () => {
//   await chatService.init();       // ← connects Redis + starts Socket.io
//   console.log(`Server running on port ${PORT}`);
// });
 
process.on('SIGTERM', async () => {
  await chatService.shutdown();
  process.exit(0);
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
