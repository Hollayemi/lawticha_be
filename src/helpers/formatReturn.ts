import { Types } from "mongoose";
import { IModule, ISubTopic, ITopic } from "../models/Module.model";

export const lawyerObject = (profile: any) => {
  return ({
    id: profile._id,
    _id: profile._id,
    nbaNumber: profile.nbaNumber,
    firstName: (profile.userId as any)?.firstName || '',
    lastName: (profile.userId as any)?.lastName || '',
    fullName: (profile.userId as any)?.firstName  + " " + (profile.userId as any)?.lastName || "",
    email: (profile.userId as any)?.email || '',
    picture: (profile.userId as any)?.avatarUrl || '',
    isUserActive: (profile.userId as any)?.isActive || '',
    lastLoginAt: (profile.userId as any)?.lastLoginAt || '',
    avatarInitials: `${(profile.userId as any)?.firstName?.[0] || ''}${(profile.userId as any)?.lastName?.[0] || ''}`,
    title: profile.title,
    specialisms: profile.specialisms,
    location: profile.location,
    state: profile.state,
    rating: profile.ratingAvg,
    reviewCount: profile.reviewCount,
    consultationCount: profile.consultationCount,
    responseTime: parseInt(profile.responseTimeLabel?.match(/\d+/)?.[0] || '2'),
    fees: {
      message: profile.fees?.message || 5000,
      call: profile.fees?.call || 12000,
      video: profile.fees?.video || 18000,
    },
    isAvailable: profile.isAvailable,
    verificationStatus: profile.verificationStatus,
    bio: profile.bio,
    yearsCall: profile.yearOfCall ? new Date().getFullYear() - profile.yearOfCall : undefined,
    yearOfCall: profile.calledAt,
    languages: profile.languages,
    badges: profile.badges,
    colorA: profile.colorA,
    colorB: profile.colorB,
  })
}




export function toModuleDto(doc: IModule & { _id: Types.ObjectId }) {
  const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
  return {
    id:                  String(obj._id),
    title:               obj.title,
    category:            obj.category,
    status:              obj.status,
    thumbnail:           obj.thumbnail,
    description:         obj.description,
    topicCount:          obj.topicCount,
    enrolledCount:       obj.enrolledCount,
    completionRate:      obj.completionRate,
    avgRating:           obj.avgRating,
    reviewCount:         obj.reviewCount,
    totalWatchTimeHours: obj.totalWatchTimeHours,
    instructor:          obj.instructor,
    instructorId:        String(obj.instructorId),
    instructorInitials:  obj.instructorInitials,
    instructorColor:     obj.instructorColor,
    trending:            obj.trending,
    createdAt:           obj.createdAt,
    updatedAt:           obj.updatedAt,
  };
}

export function toTopicDto(doc: ITopic & { _id: Types.ObjectId }) {
  const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
  return {
    id:             String(obj._id),
    moduleId:       String(obj.moduleId),
    title:          obj.title,
    classification: obj.classification,
    overview:       obj.overview,
    status:         obj.status,
    order:          obj.order,
    videoType:      obj.videoType,
    videoUrl:       obj.videoUrl,
    thumbnailUrl:   obj.thumbnailUrl,
    duration:       obj.duration,
    durationSeconds:obj.durationSeconds,
    watchCount:     obj.watchCount,
    completionRate: obj.completionRate,
    likes:          obj.likes,
    comments:       obj.comments,
    tags:           obj.tags,
    subtopicCount:  obj.subtopicCount,
    createdAt:      obj.createdAt,
    updatedAt:      obj.updatedAt,
  };
}

export function toSubTopicDto(doc: ISubTopic & { _id: Types.ObjectId }) {
  const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
  return {
    id:              String(obj._id),
    topicId:         String(obj.topicId),
    moduleId:        String(obj.moduleId),
    title:           obj.title,
    notes:           obj.notes,
    duration:        obj.duration,
    durationSeconds: obj.durationSeconds,
    order:           obj.order,
    viewCount:       obj.viewCount,
    completedBy:     obj.completedBy,
    createdAt:       obj.createdAt,
    updatedAt:       obj.updatedAt,
  };
}

export function toCommentDto(doc: any, replies: any[] = []):any {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id:           String(obj._id),
    topicId:      String(obj.topicId),
    moduleId:     String(obj.moduleId),
    userId:       String(obj.userId),
    userName:     obj.userName,
    userInitials: obj.userInitials,
    userColor:    obj.userColor,
    text:         obj.text,
    likes:        obj.likes,
    resolved:     obj.resolved,
    resolvedBy:   obj.resolvedBy,
    resolvedAt:   obj.resolvedAt,
    parentId:     obj.parentId ? String(obj.parentId) : undefined,
    replies:      replies.map((r) => toCommentDto(r)),
    createdAt:    obj.createdAt,
    updatedAt:    obj.updatedAt,
  };
}
