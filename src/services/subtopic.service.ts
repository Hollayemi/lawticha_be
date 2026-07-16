import { Types } from 'mongoose';
import { SubTopicModel, TopicModel, ModuleModel, ActivityModel } from '../models/Module.model';
import { SubtopicActivityModel, SubtopicBookmarkModel } from '../models/SubtopicEngagement.model';
import { UserModel } from '../models/User.model';
import { AppError } from '../middleware/error';

async function loadSubtopicContext(subtopicId: string) {
  if (!Types.ObjectId.isValid(subtopicId)) {
    throw new AppError('Invalid subtopic id.', 400, 'VALIDATION_ERROR');
  }

  const subtopic = await SubTopicModel.findById(subtopicId);
  if (!subtopic) {
    throw new AppError('Subtopic not found.', 404, 'NOT_FOUND');
  }

  const [topic, module] = await Promise.all([
    TopicModel.findById(subtopic.topicId),
    ModuleModel.findById(subtopic.moduleId),
  ]);

  return { subtopic, topic, module };
}

async function recordActivity(params: {
  userId: string;
  action: 'liked' | 'completed';
  targetTitle: string;
  targetId: Types.ObjectId;
  moduleId: Types.ObjectId;
}) {
  const user = await UserModel.findById(params.userId);
  if (!user) return;

  await ActivityModel.create({
    userId: user._id,
    userName: `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Citizen',
    userInitials: `${(user as any).firstName?.[0] || ''}${(user as any).lastName?.[0] || ''}`,
    action: params.action,
    targetTitle: params.targetTitle,
    targetType: 'subtopic',
    targetId: params.targetId,
    moduleId: params.moduleId,
  });
}

//  Like 

export async function toggleLikeSubtopic(subtopicId: string, citizenId: string) {
  const { subtopic } = await loadSubtopicContext(subtopicId);

  let activity = await SubtopicActivityModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    subtopicId: subtopic._id,
  });

  const wasLiked = activity?.liked || false;
  const nowLiked = !wasLiked;

  if (activity) {
    activity.liked = nowLiked;
    activity.likedAt = nowLiked ? new Date() : undefined;
    await activity.save();
  } else {
    activity = await SubtopicActivityModel.create({
      citizenId: new Types.ObjectId(citizenId),
      subtopicId: subtopic._id,
      topicId: subtopic.topicId,
      moduleId: subtopic.moduleId,
      liked: nowLiked,
      likedAt: nowLiked ? new Date() : undefined,
    });
  }

  subtopic.likesCount = Math.max(0, subtopic.likesCount + (nowLiked ? 1 : -1));
  await subtopic.save();

  if (nowLiked) {
    // await recordActivity({
    //   userId: citizenId,
    //   action: 'liked',
    //   targetTitle: subtopic.title,
    //   targetId: subtopic._id,
    //   moduleId: subtopic.moduleId,
    // });
  }

  return {
    subtopicId: subtopic._id.toString(),
    liked: nowLiked,
    likesCount: subtopic.likesCount,
  };
}

//  Mark as complete 

export async function toggleCompleteSubtopic(subtopicId: string, citizenId: string) {
  const { subtopic } = await loadSubtopicContext(subtopicId);

  let activity = await SubtopicActivityModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    subtopicId: subtopic._id,
  });

  const wasCompleted = activity?.completed || false;
  const nowCompleted = !wasCompleted;

  console.log({ wasCompleted, nowCompleted, activity })

  if (activity) {
    activity.completed = nowCompleted;
    activity.completedAt = nowCompleted ? new Date() : undefined;
    await activity.save();
  } else {
    activity = await SubtopicActivityModel.create({
      citizenId: new Types.ObjectId(citizenId),
      subtopicId: subtopic._id,
      topicId: subtopic.topicId,
      moduleId: subtopic.moduleId,
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date() : undefined,
    });
  }

  subtopic.completedBy = Math.max(0, subtopic.completedBy + (nowCompleted ? 1 : -1));
  await subtopic.save();

  if (nowCompleted) {
    // await recordActivity({
    //   userId: citizenId,
    //   action: 'completed',
    //   targetTitle: subtopic.title,
    //   targetId: subtopic._id,
    //   moduleId: subtopic.moduleId,
    // });
  }

  return {
    subtopicId: subtopic._id.toString(),
    completed: nowCompleted,
    completedBy: subtopic.completedBy,
  };
}

//  Per-citizen state (used to enrich subtopic listings) 

// subtopic.service.ts - Updated getSubtopicState function

export async function getSubtopicState(subtopicId: string, citizenId?: string) {
  const subtopic = await SubTopicModel.findById(subtopicId);
  if (!subtopic) {
    throw new AppError('Subtopic not found.', 404, 'NOT_FOUND');
  }
  const topic = await TopicModel.findById(subtopic.topicId);
  if (!topic) {
    throw new AppError('Topic not found.', 404, 'NOT_FOUND');
  }

  const allSubtopics = await SubTopicModel.find({
    topicId: subtopic.topicId
  }).sort({ order: 1 });

  // Get user's activity for all subtopics in this topic
  let userActivities: any[] = [];
  let userActivity: any = null;

  if (citizenId) {
    const subtopicIds = allSubtopics.map(st => st._id);
    userActivities = await SubtopicActivityModel.find({
      citizenId: new Types.ObjectId(citizenId),
      subtopicId: { $in: subtopicIds },
    });

    // Get the specific activity for the requested subtopic
    userActivity = userActivities.find(
      (act) => act.subtopicId.toString() === subtopicId
    );
  }

  // Calculate total likes count for this subtopic
  const totalLikes = await SubtopicActivityModel.countDocuments({
    subtopicId: new Types.ObjectId(subtopicId),
    liked: true,
  });

  // Calculate total completed count for this subtopic
  const totalCompleted = await SubtopicActivityModel.countDocuments({
    subtopicId: new Types.ObjectId(subtopicId),
    completed: true,
  });

  // Build the completed subtopics list
  const completedSubtopicIds = userActivities
    .filter(act => act.completed === true)
    .map(act => act.subtopicId.toString());

  // Get completion status for each subtopic
  const subtopicsWithStatus = allSubtopics.map(st => {
    const userActivityForSubtopic = userActivities.find(
      (act) => act.subtopicId.toString() === st._id.toString()
    );
    return {
      id: st._id.toString(),
      title: st.title,
      order: st.order,
      duration: st.duration,
      completed: userActivityForSubtopic?.completed || false,
      liked: userActivityForSubtopic?.liked || false,
    };
  });

  // Calculate topic progress percentage
  const totalSubtopics = allSubtopics.length;
  const completedCount = completedSubtopicIds.length;
  const progressPercent = totalSubtopics > 0
    ? Math.round((completedCount / totalSubtopics) * 100)
    : 0;

  // Get current subtopic details with counts
  const currentSubtopic = {
    id: subtopic._id.toString(),
    title: subtopic.title,
    order: subtopic.order,
    likesCount: totalLikes,
    completedBy: totalCompleted,
    liked: userActivity?.liked || false,
    completed: userActivity?.completed || false,
  };

  // Get topic details
  const topicDetails = {
    id: topic._id.toString(),
    title: topic.title,
    totalSubtopics: totalSubtopics,
    completedSubtopics: completedCount,
    progressPercent: progressPercent,
    completedSubtopicIds: completedSubtopicIds,
    subtopics: subtopicsWithStatus,
  };

  return {
    currentSubtopic,
    topic: topicDetails,
  };
}

// Batch version — used when rendering a list of subtopics for one citizen
export async function getSubtopicStatesBulk(subtopicIds: Types.ObjectId[], citizenId?: string) {
  const map = new Map<string, { liked: boolean; completed: boolean }>();
  if (!citizenId || subtopicIds.length === 0) return map;

  const activities = await SubtopicActivityModel.find({
    citizenId: new Types.ObjectId(citizenId),
    subtopicId: { $in: subtopicIds },
  });

  for (const activity of activities) {
    map.set(activity.subtopicId.toString(), {
      liked: activity.liked,
      completed: activity.completed,
    });
  }

  return map;
}

//  Bookmarks (text highlights + notes) 

export interface CreateBookmarkInput {
  subtopicId: string;
  citizenId: string;
  highlightedText: string;
  url: string;
  comment?: string;
  startOffset?: number;
  endOffset?: number;
}

function toBookmarkDto(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    subtopicId: String(obj.subtopicId),
    topicId: String(obj.topicId),
    moduleId: String(obj.moduleId),
    subtopicTitle: obj.subtopicTitle,
    topicTitle: obj.topicTitle,
    moduleTitle: obj.moduleTitle,
    highlightedText: obj.highlightedText,
    comment: obj.comment,
    startOffset: obj.startOffset,
    endOffset: obj.endOffset,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function createBookmark(input: CreateBookmarkInput) {
  const { subtopicId, citizenId, highlightedText, comment, url, startOffset, endOffset } = input;

  if (!highlightedText?.trim()) {
    throw new AppError('highlightedText is required.', 400, 'VALIDATION_ERROR');
  }

  const { subtopic, topic, module } = await loadSubtopicContext(subtopicId);

  const bookmark = await SubtopicBookmarkModel.create({
    citizenId: new Types.ObjectId(citizenId),
    subtopicId: subtopic._id,
    topicId: subtopic.topicId,
    moduleId: subtopic.moduleId,
    url,
    subtopicTitle: subtopic.title,
    topicTitle: topic?.title || '',
    moduleTitle: module?.title || '',
    highlightedText: highlightedText.trim(),
    comment: comment?.trim() || '',
    startOffset,
    endOffset,
  });

  return toBookmarkDto(bookmark);
}

export async function listBookmarksForSubtopic(subtopicId: string, citizenId: string) {
  let filter = {}
  if (Types.ObjectId.isValid(subtopicId)) {
    filter = {
      citizenId: new Types.ObjectId(citizenId),
      subtopicId: new Types.ObjectId(subtopicId),
    }
  }

  const bookmarks = await SubtopicBookmarkModel.find(filter).sort({ createdAt: -1 });

  return bookmarks.map(toBookmarkDto);
}

export interface ListMyBookmarksParams {
  citizenId: string;
  moduleId?: string;
  topicId?: string;
  page?: number;
  pageSize?: number;
}

export async function listMyBookmarks(params: ListMyBookmarksParams) {
  const { citizenId, moduleId, topicId, page = 1, pageSize = 20 } = params;

  const filter: any = { citizenId: new Types.ObjectId(citizenId) };
  if (moduleId) filter.moduleId = new Types.ObjectId(moduleId);
  if (topicId) filter.topicId = new Types.ObjectId(topicId);

  const skip = (page - 1) * pageSize;

  const [bookmarks, total] = await Promise.all([
    SubtopicBookmarkModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    SubtopicBookmarkModel.countDocuments(filter),
  ]);

  return {
    data: bookmarks.map(toBookmarkDto),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBookmarkById(bookmarkId: string, citizenId: string) {
  if (!Types.ObjectId.isValid(bookmarkId)) {
    throw new AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
  }

  const bookmark = await SubtopicBookmarkModel.findOne({
    _id: bookmarkId,
    citizenId: new Types.ObjectId(citizenId),
  });

  if (!bookmark) {
    throw new AppError('Bookmark not found.', 404, 'NOT_FOUND');
  }

  return toBookmarkDto(bookmark);
}

export interface UpdateBookmarkInput {
  highlightedText?: string;
  comment?: string;
  startOffset?: number;
  endOffset?: number;
}

export async function updateBookmark(bookmarkId: string, citizenId: string, input: UpdateBookmarkInput) {
  if (!Types.ObjectId.isValid(bookmarkId)) {
    throw new AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
  }

  const bookmark = await SubtopicBookmarkModel.findOne({
    _id: bookmarkId,
    citizenId: new Types.ObjectId(citizenId),
  });

  if (!bookmark) {
    throw new AppError('Bookmark not found.', 404, 'NOT_FOUND');
  }

  if (input.highlightedText !== undefined) bookmark.highlightedText = input.highlightedText.trim();
  if (input.comment !== undefined) bookmark.comment = input.comment.trim();
  if (input.startOffset !== undefined) bookmark.startOffset = input.startOffset;
  if (input.endOffset !== undefined) bookmark.endOffset = input.endOffset;

  await bookmark.save();

  return toBookmarkDto(bookmark);
}

export async function deleteBookmark(bookmarkId: string, citizenId: string) {
  if (!Types.ObjectId.isValid(bookmarkId)) {
    throw new AppError('Invalid bookmark id.', 400, 'VALIDATION_ERROR');
  }

  const result = await SubtopicBookmarkModel.findOneAndDelete({
    _id: bookmarkId,
    citizenId: new Types.ObjectId(citizenId),
  });

  if (!result) {
    throw new AppError('Bookmark not found.', 404, 'NOT_FOUND');
  }
}