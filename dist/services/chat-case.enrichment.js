"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCaseInfo = attachCaseInfo;
exports.attachCaseInfoSingle = attachCaseInfoSingle;
const mongoose_1 = require("mongoose");
const Consultation_model_1 = require("../models/Consultation.model");
async function attachCaseInfo(conversations) {
    const consultationIds = [
        ...new Set(conversations
            .filter(c => c.contextType === 'consultation' && c.contextId)
            .map(c => c.contextId.toString())),
    ];
    if (!consultationIds.length) {
        return conversations.map(c => ({ ...c, caseInfo: null }));
    }
    const consultations = await Consultation_model_1.ConsultationModel.find({
        _id: { $in: consultationIds.map(id => new mongoose_1.Types.ObjectId(id)) },
    })
        .select('topic detail status mode receiptId')
        .lean();
    const byId = new Map(consultations.map((c) => [c._id.toString(), c]));
    return conversations.map(c => {
        if (c.contextType !== 'consultation' || !c.contextId) {
            return { ...c, caseInfo: null };
        }
        const consult = byId.get(c.contextId.toString());
        if (!consult)
            return { ...c, caseInfo: null };
        return {
            ...c,
            caseInfo: {
                consultationId: consult._id.toString(),
                title: consult.topic,
                status: consult.status,
                mode: consult.mode,
                receiptId: consult.receiptId,
                detail: consult.detail,
            },
        };
    });
}
async function attachCaseInfoSingle(conversation) {
    const [result] = await attachCaseInfo([conversation]);
    return result;
}
//# sourceMappingURL=chat-case.enrichment.js.map