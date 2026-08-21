"use strict";
/**
 * Chat Service – Public API
 * ─────────────────────────
 * Import everything you need from this single entry point.
 *
 * ```ts
 * import { ChatService, createChatRouter } from './chat-service';
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatConversationModel = exports.ChatMessageModel = exports.PresenceManager = exports.ChatRepository = exports.createChatRouter = exports.ChatService = void 0;
var ChatService_1 = require("./services/ChatService");
Object.defineProperty(exports, "ChatService", { enumerable: true, get: function () { return ChatService_1.ChatService; } });
var chat_router_1 = require("./router/chat.router");
Object.defineProperty(exports, "createChatRouter", { enumerable: true, get: function () { return chat_router_1.createChatRouter; } });
var chat_repository_1 = require("./handlers/chat.repository");
Object.defineProperty(exports, "ChatRepository", { enumerable: true, get: function () { return chat_repository_1.ChatRepository; } });
var presence_manager_1 = require("./utils/presence.manager");
Object.defineProperty(exports, "PresenceManager", { enumerable: true, get: function () { return presence_manager_1.PresenceManager; } });
// Models (register with Mongoose automatically on import)
var chat_model_1 = require("./models/chat.model");
Object.defineProperty(exports, "ChatMessageModel", { enumerable: true, get: function () { return chat_model_1.ChatMessageModel; } });
Object.defineProperty(exports, "ChatConversationModel", { enumerable: true, get: function () { return chat_model_1.ChatConversationModel; } });
//# sourceMappingURL=index.js.map