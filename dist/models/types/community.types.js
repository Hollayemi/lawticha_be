"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMUNITY_ROOMS = void 0;
// Room metadata
exports.COMMUNITY_ROOMS = {
    'general': {
        name: 'General Discussion',
        description: 'General legal discussions and community conversations',
        icon: '💬',
        color: '#3B82F6',
        allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
    },
    'legal-advice': {
        name: 'Legal Advice',
        description: 'Seek legal advice from verified professionals',
        icon: '⚖️',
        color: '#10B981',
        allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
    },
    'case-study': {
        name: 'Case Studies',
        description: 'Share and discuss legal cases and scenarios',
        icon: '📋',
        color: '#F59E0B',
        allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
    },
    'law-students': {
        name: 'Law Students',
        description: 'For law students and aspiring legal professionals',
        icon: '📚',
        color: '#8B5CF6',
        allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
    },
    'lawyers-lounge': {
        name: 'Lawyers Lounge',
        description: 'Professional discussions for verified lawyers',
        icon: '👔',
        color: '#E8317A',
        allowedRoles: ['lawyer', 'admin', 'moderator']
    },
    'ask-lawyer': {
        name: 'Ask a Lawyer',
        description: 'Direct your legal questions to verified lawyers',
        icon: '🎓',
        color: '#06B6D4',
        allowedRoles: ['citizen', 'lawyer', 'admin', 'moderator']
    }
};
//# sourceMappingURL=community.types.js.map