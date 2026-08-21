"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_1 = __importDefault(require("../controllers/others/notification"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// GET /api/v1/notifications
router.get('/', (0, error_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id ?? req.user.id;
    const { page, limit, type, unreadOnly } = req.query;
    const filter = { userId };
    const result = await notification_1.default.getNotificationList(filter, 'user', {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        type: type,
        unreadOnly: unreadOnly === 'true',
    });
    res.data(result, 'Notifications retrieved successfully');
}));
// GET /api/v1/notifications/unread-count
router.get('/unread-count', (0, error_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id ?? req.user.id;
    const result = await notification_1.default.getUnreadCount(userId, 'user');
    res.data(result, 'Unread count retrieved');
}));
// PATCH /api/v1/notifications/read-all
router.patch('/read-all', (0, error_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id ?? req.user.id;
    await notification_1.default.markAllAsRead(userId, 'user');
    res.success('All notifications marked as read');
}));
// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', (0, error_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user._id ?? req.user.id;
    try {
        const result = await notification_1.default.markAsRead(req.params.id, userId.toString());
        res.data(result, 'Notification marked as read');
    }
    catch (err) {
        return next(new error_1.AppError(err.message || 'Notification not found', 404));
    }
}));
// POST /api/v1/notifications/:id/click
router.post('/:id/click', (0, error_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user._id ?? req.user.id;
    try {
        const result = await notification_1.default.trackClick(req.params.id, userId.toString());
        res.data(result, 'Click tracked');
    }
    catch (err) {
        return next(new error_1.AppError(err.message || 'Notification not found', 404));
    }
}));
// DELETE /api/v1/notifications/:id
router.delete('/:id', (0, error_1.asyncHandler)(async (req, res, next) => {
    const userId = req.user._id ?? req.user.id;
    try {
        await notification_1.default.deleteNotification(req.params.id, userId.toString());
        res.success('Notification deleted');
    }
    catch (err) {
        return next(new error_1.AppError(err.message || 'Notification not found', 404));
    }
}));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map