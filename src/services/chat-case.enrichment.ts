import { Types } from 'mongoose';
import { ConsultationModel } from '../models/Consultation.model';

export interface CaseInfo {
  consultationId: string;
  title: string;
  status: string;
  mode: string;
  receiptId?: string;
  detail?: string;
}

type ConversationLike = {
  contextType?: string;
  contextId?: Types.ObjectId | string;
};

export async function attachCaseInfo<T extends ConversationLike>(
  conversations: T[],
): Promise<(T & { caseInfo: CaseInfo | null })[]> {
  const consultationIds = [
    ...new Set(
      conversations
        .filter(c => c.contextType === 'consultation' && c.contextId)
        .map(c => c.contextId!.toString()),
    ),
  ];

  if (!consultationIds.length) {
    return conversations.map(c => ({ ...c, caseInfo: null }));
  }

  interface ConsultLean {
    _id: Types.ObjectId;
    topic: string;
    detail?: string;
    status: string;
    mode: string;
    receiptId?: string;
  }

  const consultations = await ConsultationModel.find({
    _id: { $in: consultationIds.map(id => new Types.ObjectId(id)) },
  })
    .select('topic detail status mode receiptId')
    .lean<ConsultLean[]>();

  const byId = new Map(consultations.map((c: ConsultLean) => [c._id.toString(), c]));

  return conversations.map(c => {
    if (c.contextType !== 'consultation' || !c.contextId) {
      return { ...c, caseInfo: null };
    }

    const consult = byId.get(c.contextId.toString());
    if (!consult) return { ...c, caseInfo: null };

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


export async function attachCaseInfoSingle<T extends ConversationLike>(
  conversation: T,
): Promise<T & { caseInfo: CaseInfo | null }> {
  const [result] = await attachCaseInfo([conversation]);
  return result;
}
