"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatRouter = createChatRouter;
const express_1 = require("express");
function createChatRouter(chat, options = {}) {
    const router = (0, express_1.Router)();
    const { enrichConversations } = options;
    function getUserId(req) {
        return req.user?._id?.toString() ?? req.admin?.id;
    }
    function isAdmin(req) {
        return Boolean(req.admin?.id);
    }
    function getUserName(req) {
        const user = req.user;
        const admin = req.admin;
        if (user)
            return `${user.firstName} ${user.lastName}`.trim();
        if (admin)
            return admin.name;
        return 'User';
    }
    function getUserRole(req) {
        const user = req.user;
        const admin = req.admin;
        if (admin)
            return 'admin';
        return (user?.role ?? 'citizen');
    }
    function respond(res, data, message = 'Success', status = 200) {
        res.status(status).json({ success: true, message, data });
    }
    function fail(next, message, status = 400) {
        const err = new Error(message);
        err.statusCode = status;
        next(err);
    }
    // ─── GET /conversations ───────────────────────────────────────────────────
    // List inbox for the authenticated user
    router.get('/conversations', async (req, res, next) => {
        const userId = getUserId(req);
        console.log("hereeeeeeeeeeeeeeeeeee");
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const { status, page, pageSize } = req.query;
        const result = await chat.getConversationsForUser({
            userId,
            status: status || 'active',
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 20,
        });
        // Enrich each conversation with online presence
        const participantIds = [
            ...new Set(result.data.flatMap(c => c.participants.map(p => p.userId.toString()))),
        ];
        const presenceMap = await chat.getPresenceBulk(participantIds);
        let enriched = result.data.map(conv => ({
            ...conv,
            participants: conv.participants.map(p => ({
                ...p,
                isOnline: presenceMap[p.userId.toString()]?.isOnline ?? false,
                lastSeenAt: presenceMap[p.userId.toString()]?.lastSeenAt,
            })),
        }));
        if (enrichConversations) {
            enriched = await enrichConversations(enriched);
        }
        respond(res, { conversations: enriched, total: result.total });
    });
    // ─── POST /conversations ──────────────────────────────────────────────────
    // Create a new direct conversation (citizen ↔ lawyer)
    router.post('/conversations', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const { targetUserId, targetUserName, targetUserRole, targetAvatarUrl, contextType, contextId, metadata, } = req.body;
        if (!targetUserId)
            return fail(next, 'targetUserId is required.');
        const { conversation, created } = await chat.findOrCreateConversation({
            contextType: contextType || 'direct',
            contextId: contextId || [userId, targetUserId].sort().join('_'),
            participants: [
                {
                    userId: userId,
                    role: getUserRole(req),
                    name: getUserName(req),
                    avatarUrl: req.user?.avatarUrl,
                },
                {
                    userId: targetUserId,
                    role: targetUserRole ?? 'lawyer',
                    name: targetUserName ?? 'User',
                    avatarUrl: targetAvatarUrl,
                },
            ],
            metadata,
        });
        respond(res, { conversation }, created ? 'Conversation created.' : 'Conversation found.', created ? 201 : 200);
    });
    // ─── GET /conversations/:id ───────────────────────────────────────────────
    router.get('/conversations/:id', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const conversation = await chat.getConversation(req.params.id);
        if (!conversation)
            return fail(next, 'Conversation not found.', 404);
        const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
        if (!isParticipant)
            return fail(next, 'Forbidden', 403);
        // Presence enrichment
        const participantIds = conversation.participants.map(p => p.userId.toString());
        const presenceMap = await chat.getPresenceBulk(participantIds);
        let enriched = {
            ...conversation,
            participants: conversation.participants.map(p => ({
                ...p,
                isOnline: presenceMap[p.userId.toString()]?.isOnline ?? false,
                lastSeenAt: presenceMap[p.userId.toString()]?.lastSeenAt,
            })),
        };
        if (enrichConversations) {
            [enriched] = await enrichConversations([enriched]);
        }
        respond(res, { conversation: enriched });
    });
    // ─── GET /conversations/context/:contextType/:contextId ──────────────────
    // Look up a conversation by its context (e.g. a consultation's chat by
    // consultationId). Useful when the frontend has a consultation/case ID
    // (from the consultations list) and wants to open its chat directly.
    router.get('/conversations/context/:contextType/:contextId', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const { contextType, contextId } = req.params;
        const conversation = await chat.getConversationByContext(contextType, contextId);
        if (!conversation)
            return fail(next, 'Conversation not found.', 404);
        const isadmin = isAdmin(req);
        if (!isadmin) {
            const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
            if (!isParticipant)
                return fail(next, 'Forbidden', 403);
        }
        const participantIds = conversation.participants.map(p => p.userId.toString());
        const presenceMap = await chat.getPresenceBulk(participantIds);
        let enriched = {
            ...conversation,
            participants: conversation.participants.map(p => ({
                ...p,
                isOnline: presenceMap[p.userId.toString()]?.isOnline ?? false,
                lastSeenAt: presenceMap[p.userId.toString()]?.lastSeenAt,
            })),
        };
        if (enrichConversations) {
            [enriched] = await enrichConversations([enriched]);
        }
        respond(res, { conversation: enriched });
    });
    // ─── GET /conversations/:id/messages ─────────────────────────────────────
    router.get('/conversations/:id/messages', async (req, res, next) => {
        const userId = getUserId(req);
        const isadmin = isAdmin(req);
        console.log({ userId });
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const conversation = await chat.getConversation(req.params.id);
        if (!conversation)
            return fail(next, 'Conversation not found.', 404);
        if (!isadmin) {
            const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
            if (!isParticipant)
                return fail(next, 'Forbidden', 403);
        }
        const { before, limit } = req.query;
        const messages = await chat.getMessages({
            conversationId: req.params.id,
            before,
            limit: limit ? Number(limit) : undefined,
        });
        respond(res, { messages });
    });
    // ─── GET /conversations/:id/presence ─────────────────────────────────────
    // Quick presence check for participants of a conversation
    router.get('/conversations/:id/presence', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const conversation = await chat.getConversation(req.params.id);
        if (!conversation)
            return fail(next, 'Conversation not found.', 404);
        const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
        if (!isParticipant)
            return fail(next, 'Forbidden', 403);
        const ids = conversation.participants.map(p => p.userId.toString());
        const presenceMap = await chat.getPresenceBulk(ids);
        respond(res, { presence: presenceMap });
    });
    // ─── POST /conversations/:id/close ───────────────────────────────────────
    // Close a conversation (admin or consultation end)
    router.post('/conversations/:id/close', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const { reason } = req.body;
        await chat.closeConversation(req.params.id, reason);
        respond(res, null, 'Conversation closed.');
    });
    // ─── GET /presence ────────────────────────────────────────────────────────
    // Bulk presence check for arbitrary user IDs
    router.get('/presence', async (req, res, next) => {
        const userId = getUserId(req);
        if (!userId)
            return fail(next, 'Unauthorized', 401);
        const ids = req.query.userIds?.split(',').filter(Boolean) ?? [];
        if (!ids.length)
            return fail(next, 'userIds query param is required.');
        const presenceMap = await chat.getPresenceBulk(ids);
        respond(res, { presence: presenceMap });
    });
    return router;
}
//# sourceMappingURL=chat.router.js.map