"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const ChatService_1 = require("./services/chat-service/services/ChatService");
const chat_router_1 = require("./services/chat-service/router/chat.router");
const chat_case_enrichment_1 = require("./services/chat-case.enrichment");
const database_1 = __importDefault(require("./config/database"));
const error_1 = require("./middleware/error");
dotenv_1.default.config();
(0, database_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
//  Security 
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000' || "https://lawticha.vercel.app",
    credentials: true,
}));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
app.use((0, cookie_parser_1.default)());
// app.use(jsonParseErrorHandler);
app.use(error_1.extendResponse);
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
//  Health check 
app.get('/health', (_req, res) => {
    res.data({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
    }, 'Server is healthy');
});
//  Route imports 
const learn_routes_1 = __importDefault(require("./routes/learn.routes"));
const others_routes_1 = __importDefault(require("./routes/others.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const community_routes_1 = __importDefault(require("./routes/community.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Legacy LawTicha auth (keep if still needed)
const library_routes_1 = __importDefault(require("./routes/library.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const citizen_routes_1 = __importDefault(require("./routes/citizen.routes"));
const lawyer_routes_1 = __importDefault(require("./routes/lawyer.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const citizenSubscription_routes_1 = __importDefault(require("./routes/citizenSubscription.routes"));
const marketplace_routes_1 = __importDefault(require("./routes/marketplace.routes"));
const consultation_routes_1 = __importDefault(require("./routes/consultation.routes"));
// LawTicha admin
// import adminRoutes       from './routes/admin.routes';
const auth_admin_routes_1 = __importDefault(require("./routes/admin/auth.admin.routes"));
const citizen_admin_routes_1 = __importDefault(require("./routes/admin/citizen.admin.routes"));
const community_admin_routes_1 = __importDefault(require("./routes/admin/community.admin.routes"));
const library_admin_routes_1 = __importDefault(require("./routes/admin/library.admin.routes"));
const lawyer_admin_routes_1 = __importDefault(require("./routes/admin/lawyer.admin.routes"));
const module_admin_routes_1 = __importDefault(require("./routes/admin/module.admin.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin/admin.routes"));
const dashboard_admin_routes_1 = __importDefault(require("./routes/admin/dashboard.admin.routes"));
const consultation_admin_routes_1 = __importDefault(require("./routes/admin/consultation.admin.routes"));
const subscription_admin_routes_1 = __importDefault(require("./routes/admin/subscription.admin.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
// auth
app.use('/api/v1/auth/admin', auth_admin_routes_1.default);
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/payment', payment_routes_1.default);
// Mount the routes (adjust base path as needed)
// Public
app.use('/api/v1', others_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/learn', learn_routes_1.default);
app.use('/api/v1/community', community_routes_1.default);
app.use('/api/v1/library', library_routes_1.default);
app.use('/api/v1/consultations', consultation_routes_1.default);
app.use('/api/v1/lawyers', lawyer_routes_1.default);
app.use('/api/v1/marketplace', marketplace_routes_1.default);
app.use('/api/v1/citizen', citizen_routes_1.default);
app.use('/api/v1/citizens', citizenSubscription_routes_1.default);
// Legacy LawTicha
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/admin/community', community_admin_routes_1.default);
app.use('/api/v1/admin/dashboard', dashboard_admin_routes_1.default);
app.use('/api/v1/admin/citizens', citizen_admin_routes_1.default);
app.use('/api/v1/admin/library', library_admin_routes_1.default);
app.use('/api/v1/admin/lawyers', lawyer_admin_routes_1.default);
app.use('/api/v1/admin/modules', module_admin_routes_1.default);
app.use('/api/v1/admin/consultations', consultation_admin_routes_1.default);
app.use('/api/v1/admin/subscriptions', subscription_admin_routes_1.default);
// ── Create HTTP server (required for Socket.io) ──────────────────────────────
const httpServer = http_1.default.createServer(app);
exports.chatService = new ChatService_1.ChatService(httpServer, {
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET,
    corsOrigins: process.env.CLIENT_URL ?? 'http://localhost:3000',
    presenceTtlSeconds: 30,
    heartbeatIntervalMs: 20000,
    messagesPageSize: 50,
});
app.use('/api/v1/chat', auth_middleware_1.protectBoth, (0, chat_router_1.createChatRouter)(exports.chatService, {
    enrichConversations: chat_case_enrichment_1.attachCaseInfo,
}));
//  Error handling 
app.use('*', error_1.handle404);
app.use(error_1.errorHandler);
// seedSpecialisms()
// seedSubscriptionPlans()
//  Start 
const server = httpServer.listen(PORT, async () => {
    await exports.chatService.init();
    console.log(`
    LawTicha Server Running
    Environment: ${process.env.NODE_ENV}
    Port:        ${PORT}
    Time:        ${new Date().toLocaleTimeString()}
  `);
});
process.on('SIGTERM', async () => {
    await exports.chatService.shutdown();
    process.exit(0);
});
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map