import { Types } from 'mongoose';
import {
  ModuleModel,
  TopicModel,
  SubTopicModel,
  ActivityModel,
  CommentModel,
  IModule,
  ITopic,
  ISubTopic,
  ModuleStatus,
  TopicStatus,
  VideoType,
  ModuleCategory,
} from '../models/Module.model';
import { EnrollmentModel, UserProgressModel } from '../models/Enrollment.model';
import { UserModel } from '../models/User.model';
import { AppError } from '../middleware/error';
import { colorFromString, generateSlug } from '../utils/functions';
import { toModuleDto, toTopicDto, toSubTopicDto, toCommentDto } from '../helpers/formatReturn';
import cloudinary from '../utils/cloudinary';


//  MODULE CRUD 

export interface ModuleFilters {
  status?: ModuleStatus | 'all';
  category?: ModuleCategory | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listModules(filters: ModuleFilters = {}) {
  const {
    status, category, search,
    page = 1, pageSize = 20,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = filters;

  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (category && category !== 'all') filter.category = category;
  if (search?.trim()) {
    filter.$text = { $search: search.trim() };
  }

  const skip = (page - 1) * pageSize;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [docs, total] = await Promise.all([
    ModuleModel.find(filter).sort(sort).skip(skip).limit(pageSize),
    ModuleModel.countDocuments(filter),
  ]);

  return {
    data: docs.map(toModuleDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getModuleStats() {
  const [totalModules, topicAgg, enrollAgg] = await Promise.all([
    ModuleModel.countDocuments(),
    TopicModel.countDocuments(),
    ModuleModel.aggregate([
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: '$enrolledCount' },
          avgCompletion: { $avg: '$completionRate' },
        },
      },
    ]),
  ]);

  return {
    totalModules,
    totalTopics: topicAgg,
    totalEnrolled: enrollAgg[0]?.totalEnrolled ?? 0,
    avgCompletion: enrollAgg[0]?.avgCompletion
      ? Math.round(enrollAgg[0].avgCompletion)
      : 0,
  };
}

export async function getDailyStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const [todayActivity, yesterdayActivity] = await Promise.all([
    ActivityModel.countDocuments({ createdAt: { $gte: startOfToday } }),
    ActivityModel.countDocuments({
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    }),
  ]);

  const todayEnrolled = await ActivityModel.countDocuments({
    action: 'enrolled',
    createdAt: { $gte: startOfToday },
  });
  const yesterdayEnrolled = await ActivityModel.countDocuments({
    action: 'enrolled',
    createdAt: { $gte: startOfYesterday, $lt: startOfToday },
  });

  const todayCompleted = await ActivityModel.countDocuments({
    action: 'completed',
    createdAt: { $gte: startOfToday },
  });
  const yesterdayCompleted = await ActivityModel.countDocuments({
    action: 'completed',
    createdAt: { $gte: startOfYesterday, $lt: startOfToday },
  });

  const pct = (a: number, b: number) =>
    b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100);

  return {
    lessonsWatchedToday: todayActivity,
    lessonsWatchedChange: pct(todayActivity, yesterdayActivity),
    newEnrolmentsToday: todayEnrolled,
    newEnrolmentsChange: pct(todayEnrolled, yesterdayEnrolled),
    completionsToday: todayCompleted,
    completionsChange: pct(todayCompleted, yesterdayCompleted),
    avgSessionDurationMinutes: 12,   // placeholder – wire real session data when available
    avgSessionDurationChange: 0,
  };
}

export async function getModuleById(id: string) {
  const doc = await ModuleModel.findById(id);
  if (!doc) throw new AppError('Module not found.', 404, 'NOT_FOUND');
  return toModuleDto(doc as any);
}

export interface CreateModuleInput {
  title: string;
  category: ModuleCategory;
  description: string;
  instructorId: string;
  thumbnailUrl?: string;
  thumbnailFile?: string;
  status?: ModuleStatus;
}

export async function createModule(input: CreateModuleInput) {
  let instructorName = 'Instructor';
  let instructorInitials = 'IN';
  let instructorColor = colorFromString(input.instructorId);

  try {
    const user = await UserModel.findById(input.instructorId);
    if (user) {
      instructorName = `${user.firstName} ${user.lastName}`.trim();
      instructorInitials = (user.firstName[0] ?? '') + (user.lastName[0] ?? '');
      instructorColor = colorFromString(instructorName);
    } 77
  } catch { /* silently ignore – instructor fields are denorm */ }
  console.log({input})
  const thumbnail = input.thumbnailUrl || input.thumbnailFile && await (await cloudinary.uploadImage(input.thumbnailFile, "book/modules")).url
  console.log({ thumbnail, file:  input.thumbnailFile })
  if (!thumbnail) throw (new AppError('Upload at least one cover File', 400, 'VALIDATION_ERROR'));

  const doc = await ModuleModel.create({
    title: input.title,
    slug: generateSlug(input.title),
    category: input.category,
    description: input.description,
    instructorId: new Types.ObjectId(input.instructorId),
    instructor: instructorName,
    instructorInitials: instructorInitials.toUpperCase(),
    instructorColor,
    thumbnail: thumbnail,
    status: input.status ?? 'pending',
  });

  return toModuleDto(doc as any);
}

export interface UpdateModuleInput {
  title?: string;
  category?: ModuleCategory;
  description?: string;
  instructorId?: string;
  thumbnailUrl?: string;
  status?: ModuleStatus;
  trending?: boolean;
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const doc = await ModuleModel.findById(id);
  if (!doc) throw new AppError('Module not found.', 404, 'NOT_FOUND');

  const updates: Partial<IModule> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
    updates.slug = generateSlug(input.title);
  }
  if (input.category !== undefined) updates.category = input.category;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;
  if (input.trending !== undefined) updates.trending = input.trending;
  if (input.thumbnailUrl !== undefined) updates.thumbnail = input.thumbnailUrl;

  if (input.instructorId) {
    try {
      const user = await UserModel.findById(input.instructorId);
      if (user) {
        updates.instructor = `${user.firstName} ${user.lastName}`.trim();
        updates.instructorInitials = ((user.firstName[0] ?? '') + (user.lastName[0] ?? '')).toUpperCase();
        updates.instructorColor = colorFromString(updates.instructor);
      }
    } catch { /* silently ignore */ }
    (updates as any).instructorId = new Types.ObjectId(input.instructorId);
  }

  const updated = await ModuleModel.findByIdAndUpdate(id, updates, { new: true });
  return toModuleDto(updated as any);
}

export async function deleteModule(id: string) {
  const doc = await ModuleModel.findById(id);
  if (!doc) throw new AppError('Module not found.', 404, 'NOT_FOUND');

  // Cascade delete topics, subtopics, activity, comments
  const topics = await TopicModel.find({ moduleId: id }, { _id: 1 });
  const topicIds = topics.map((t) => t._id);

  await Promise.all([
    SubTopicModel.deleteMany({ moduleId: id }),
    CommentModel.deleteMany({ moduleId: id }),
    ActivityModel.deleteMany({ moduleId: id }),
    TopicModel.deleteMany({ moduleId: id }),
    ModuleModel.findByIdAndDelete(id),
  ]);
}

//  TOPIC CRUD 

export async function listTopics(moduleId: string, status?: string) {
  const filter = {} as any
  if (status) filter.status = status
  const topics = await TopicModel.find({ moduleId, ...filter }).sort({ order: 1 });

  const topicIds = topics.map((t) => t._id);

  const subtopics = await SubTopicModel.find({
    moduleId,
    topicId: { $in: topicIds },
  }).sort({ order: 1 });

  // Group subtopics by topicId
  const subtopicsMap = new Map();

  for (const subtopic of subtopics) {
    const key = subtopic.topicId.toString();

    if (!subtopicsMap.has(key)) {
      subtopicsMap.set(key, []);
    }

    subtopicsMap.get(key).push(toSubTopicDto(subtopic));
  }

  return topics.map((topic) => ({
    ...toTopicDto(topic),
    subtopics: subtopicsMap.get(topic._id.toString()) || [],
  }));
}

export async function getTopicById(moduleId: string, topicId: string) {
  const topic = await TopicModel.findOne({ _id: topicId, moduleId });
  if (!topic) throw new AppError('Topic not found.', 404, 'NOT_FOUND');

  const subtopics = await SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });

  console.log(subtopics)

  return {
    ...toTopicDto(topic as any),
    subtopics: subtopics.map(toSubTopicDto),
  };
}

export interface CreateTopicInput {
  moduleId: string;
  title: string;
  classification: string;
  overview: string;
  status?: TopicStatus;
  order?: number;
  videoType?: VideoType;
  videoUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export async function createTopic(input: CreateTopicInput) {
  const module = await ModuleModel.findById(input.moduleId);
  if (!module) throw new AppError('Module not found.', 404, 'NOT_FOUND');

  // Default order = last + 1
  let order = input.order;
  if (order === undefined) {
    const last = await TopicModel.findOne({ moduleId: input.moduleId }).sort({ order: -1 });
    order = (last?.order ?? 0) + 1;
  }

  const doc = await TopicModel.create({
    moduleId: new Types.ObjectId(input.moduleId),
    title: input.title,
    slug: generateSlug(input.title),
    classification: input.classification,
    overview: input.overview,
    status: input.status ?? 'draft',
    order,
    videoType: input.videoType ?? null,
    videoUrl: input.videoUrl ?? '',
    thumbnailUrl: input.thumbnailUrl ?? '',
    tags: input.tags ?? [],
  });

  // Increment topicCount on module
  await ModuleModel.findByIdAndUpdate(input.moduleId, { $inc: { topicCount: 1 } });

  return toTopicDto(doc as any);
}

export interface UpdateTopicInput {
  title?: string;
  classification?: string;
  overview?: string;
  status?: TopicStatus;
  order?: number;
  videoType?: VideoType | null;
  videoUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export async function updateTopic(moduleId: string, topicId: string, input: UpdateTopicInput) {
  const topic = await TopicModel.findOne({ _id: topicId, moduleId });
  if (!topic) throw new AppError('Topic not found.', 404, 'NOT_FOUND');

  const updates: Partial<ITopic> = {};
  if (input.title !== undefined) {
    updates.title = input.title;
    updates.slug = generateSlug(input.title);
  }
  if (input.classification !== undefined) updates.classification = input.classification;
  if (input.overview !== undefined) updates.overview = input.overview;
  if (input.status !== undefined) updates.status = input.status;
  if (input.order !== undefined) updates.order = input.order;
  if (input.videoType !== undefined) updates.videoType = input.videoType;
  if (input.videoUrl !== undefined) updates.videoUrl = input.videoUrl;
  if (input.thumbnailUrl !== undefined) updates.thumbnailUrl = input.thumbnailUrl;
  if (input.tags !== undefined) updates.tags = input.tags;

  const updated = await TopicModel.findByIdAndUpdate(topicId, updates, { new: true });
  return toTopicDto(updated as any);
}

export async function deleteTopic(moduleId: string, topicId: string) {
  const topic = await TopicModel.findOne({ _id: topicId, moduleId });
  if (!topic) throw new AppError('Topic not found.', 404, 'NOT_FOUND');

  await Promise.all([
    SubTopicModel.deleteMany({ topicId }),
    CommentModel.deleteMany({ topicId }),
    TopicModel.findByIdAndDelete(topicId),
  ]);

  // Decrement topicCount and re-order remaining topics
  await ModuleModel.findByIdAndUpdate(moduleId, { $inc: { topicCount: -1 } });

  const remaining = await TopicModel.find({ moduleId }).sort({ order: 1 });
  await Promise.all(
    remaining.map((t, i) => TopicModel.findByIdAndUpdate(t._id, { order: i + 1 }))
  );
}

export async function reorderTopics(moduleId: string, orderedIds: string[]) {
  const ops = orderedIds.map((id, i) =>
    TopicModel.findOneAndUpdate({ _id: id, moduleId }, { order: i + 1 })
  );
  await Promise.all(ops);
}

//  SUBTOPIC CRUD 

export async function listSubTopics(moduleId: string, topicId: string) {
  const docs = await SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });
  return docs.map(toSubTopicDto);
}

export interface CreateSubTopicInput {
  moduleId: string;
  topicId: string;
  title: string;
  notes?: string;
  duration?: string;
  order?: number;
}

export async function createSubTopic(input: CreateSubTopicInput) {
  const topic = await TopicModel.findOne({ _id: input.topicId, moduleId: input.moduleId });
  if (!topic) throw new AppError('Topic not found.', 404, 'NOT_FOUND');

  let order = input.order;
  if (order === undefined) {
    const last = await SubTopicModel.findOne({ topicId: input.topicId }).sort({ order: -1 });
    order = (last?.order ?? 0) + 1;
  }

  const doc = await SubTopicModel.create({
    topicId: new Types.ObjectId(input.topicId),
    moduleId: new Types.ObjectId(input.moduleId),
    title: input.title,
    slug: generateSlug(input.title),
    notes: input.notes ?? '',
    duration: input.duration ?? '0:00',
    order,
  });

  // Increment subtopicCount on topic
  await TopicModel.findByIdAndUpdate(input.topicId, { $inc: { subtopicCount: 1 } });

  return toSubTopicDto(doc as any);
}

export interface UpdateSubTopicInput {
  title?: string;
  notes?: string;
  duration?: string;
  order?: number;
}

export async function updateSubTopic(
  moduleId: string, topicId: string, subtopicId: string, input: UpdateSubTopicInput
) {
  const doc = await SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
  if (!doc) throw new AppError('SubTopic not found.', 404, 'NOT_FOUND');

  const updates: Partial<ISubTopic> = {};
  if (input.title !== undefined) {
    updates.title = input.title;
    updates.slug = generateSlug(input.title);
  }
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.duration !== undefined) updates.duration = input.duration;
  if (input.order !== undefined) updates.order = input.order;

  const updated = await SubTopicModel.findByIdAndUpdate(subtopicId, updates, { new: true });
  return toSubTopicDto(updated as any);
}

export async function updateSubTopicNotes(
  moduleId: string, topicId: string, subtopicId: string, notes: string
) {
  const doc = await SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
  if (!doc) throw new AppError('SubTopic not found.', 404, 'NOT_FOUND');

  const updated = await SubTopicModel.findByIdAndUpdate(
    subtopicId, { notes }, { new: true }
  );
  return {
    id: String(updated!._id),
    notes: updated!.notes,
    updatedAt: updated!.updatedAt,
  };
}

export async function deleteSubTopic(moduleId: string, topicId: string, subtopicId: string) {
  const doc = await SubTopicModel.findOne({ _id: subtopicId, topicId, moduleId });
  if (!doc) throw new AppError('SubTopic not found.', 404, 'NOT_FOUND');

  await SubTopicModel.findByIdAndDelete(subtopicId);
  await TopicModel.findByIdAndUpdate(topicId, { $inc: { subtopicCount: -1 } });

  const remaining = await SubTopicModel.find({ topicId }).sort({ order: 1 });
  await Promise.all(
    remaining.map((s, i) => SubTopicModel.findByIdAndUpdate(s._id, { order: i + 1 }))
  );
}

export async function reorderSubTopics(
  moduleId: string, topicId: string, orderedIds: string[]
) {
  const ops = orderedIds.map((id, i) =>
    SubTopicModel.findOneAndUpdate({ _id: id, topicId, moduleId }, { order: i + 1 })
  );
  await Promise.all(ops);
}


export async function getModuleActivity(
  moduleId: string, limit = 20, before?: string
) {
  const filter: Record<string, unknown> = { moduleId };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const docs = await ActivityModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  return docs.map((d) => {
    const obj = d.toObject();
    return {
      id: String(obj._id),
      userId: String(obj.userId),
      userName: obj.userName,
      userInitials: obj.userInitials,
      userColor: obj.userColor,
      action: obj.action,
      targetTitle: obj.targetTitle,
      targetType: obj.targetType,
      targetId: String(obj.targetId),
      moduleId: String(obj.moduleId),
      createdAt: obj.createdAt,
    };
  });
}

//  ANALYTICS 

export async function getModuleAnalytics(moduleId: string) {
  const module = await ModuleModel.findById(moduleId);
  if (!module) throw new AppError('Module not found.', 404, 'NOT_FOUND');

  const topics = await TopicModel.find({ moduleId }).sort({ order: 1 });

  // Progress distribution buckets from real enrollment data
  let progressDistribution = [
    { label: 'Not started', count: 0, percentage: 0, color: '#E5E7EB' },
    { label: 'In progress', count: 0, percentage: 0, color: '#F59E0B' },
    { label: 'Completed', count: 0, percentage: 0, color: '#10B981' },
  ];

  try {
    const mId = new Types.ObjectId(moduleId);
    const enrollments = await EnrollmentModel.find({ moduleId: mId });
    const total = enrollments.length;

    if (total > 0) {
      const notStarted = enrollments.filter((e) => e.progressPercent === 0).length;
      const inProgress = enrollments.filter((e) => e.progressPercent > 0 && e.progressPercent < 100).length;
      const completed = enrollments.filter((e) => e.progressPercent >= 100).length;

      progressDistribution = [
        { label: 'Not started', count: notStarted, percentage: Math.round((notStarted / total) * 100), color: '#E5E7EB' },
        { label: 'In progress', count: inProgress, percentage: Math.round((inProgress / total) * 100), color: '#F59E0B' },
        { label: 'Completed', count: completed, percentage: Math.round((completed / total) * 100), color: '#10B981' },
      ];
    }
  } catch { /* enrollment model may not exist yet */ }

  const topicPerformance = topics.map((t) => ({
    topicId: String(t._id),
    title: t.title,
    classification: t.classification,
    order: t.order,
    watchCount: t.watchCount,
    completionRate: t.completionRate,
    likes: t.likes,
    comments: t.comments,
    status: t.status,
    duration: t.duration,
  }));

  return {
    moduleId: moduleId,
    enrolledCount: module.enrolledCount,
    completionRate: module.completionRate,
    avgRating: module.avgRating,
    totalWatchTimeHours: module.totalWatchTimeHours,
    progressDistribution,
    topicPerformance,
    updatedAt: module.updatedAt,
  };
}

export async function getTopicAnalytics(moduleId: string, topicId: string) {
  const topic = await TopicModel.findOne({ _id: topicId, moduleId });
  if (!topic) throw new AppError('Topic not found.', 404, 'NOT_FOUND');

  const subtopics = await SubTopicModel.find({ topicId, moduleId }).sort({ order: 1 });

  // Build last 7 days of daily views
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dailyViews = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return {
      day: days[d.getDay()],
      date: d.toISOString().split('T')[0],
      views: 0, // real: aggregate from activity
    };
  });

  // Sub-topic completion rows
  const subtopicCompletion = subtopics.map((s, i) => ({
    subtopicId: String(s._id),
    title: s.title,
    order: s.order,
    viewCount: s.viewCount,
    completedBy: s.completedBy,
    dropOffPercentage: i === 0 ? 0 : (subtopics[0].viewCount > 0
      ? Math.round((1 - s.viewCount / subtopics[0].viewCount) * 100)
      : 0),
  }));

  const likeRate = topic.watchCount > 0 ? +((topic.likes / topic.watchCount) * 100).toFixed(1) : 0;
  const commentRate = topic.watchCount > 0 ? +((topic.comments / topic.watchCount) * 100).toFixed(1) : 0;

  return {
    topicId: topicId,
    watchCount: topic.watchCount,
    completionRate: topic.completionRate,
    likes: topic.likes,
    comments: topic.comments,
    avgWatchDurationSeconds: topic.durationSeconds * (topic.completionRate / 100) || 0,
    likeRate,
    commentRate,
    dailyViews,
    subtopicCompletion,
    topStates: [],   // wire to real geodata when available
    weeklyEngagement: [
      { label: 'Watch time', value: `${topic.durationSeconds}s`, trend: '0%', up: true },
      { label: 'Like rate', value: `${likeRate}%`, trend: '0%', up: true },
      { label: 'Comment rate', value: `${commentRate}%`, trend: '0%', up: true },
    ],
    updatedAt: topic.updatedAt,
  };
}

//  LEARNERS 

export interface CommentsParams {
  moduleId: string;
  topicId: string;
  resolved?: boolean;
}

export interface LearnersParams {
  moduleId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'enrolledAt' | 'progress' | 'lastActiveAt';
  sortOrder?: 'asc' | 'desc';
}

export async function getModuleLearners(params: LearnersParams) {
  const {
    moduleId, page = 1, pageSize = 20,
    search, sortBy = 'enrolledAt', sortOrder = 'desc',
  } = params;

  const enrollFilter: Record<string, unknown> = {
    moduleId: new Types.ObjectId(moduleId),
  };

  const skip = (page - 1) * pageSize;
  const sortField = sortBy === 'progress' ? 'progressPercent' : sortBy === 'lastActiveAt' ? 'lastActivityAt' : 'startedAt';
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  let enrollments: any[];
  let total: number;

  try {
    [enrollments, total] = await Promise.all([
      EnrollmentModel.find(enrollFilter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .populate('citizenId', 'firstName lastName email'),
      EnrollmentModel.countDocuments(enrollFilter),
    ]);
  } catch {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const module = await ModuleModel.findById(moduleId);
  const totalTopics = module?.topicCount ?? 0;

  const data = enrollments.map((e) => {
    const user: any = e.citizenId;
    const name = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'Unknown';
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');

    return {
      id: String(e._id),
      name,
      initials,
      color: colorFromString(name),
      email: user?.email ?? '',
      state: '',
      enrolledAt: e.startedAt,
      progressPercentage: e.progressPercent,
      topicsCompleted: e.lessonsCompleted?.length ?? 0,
      totalTopics,
      lastActiveAt: e.lastActivityAt,
    };
  });

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTopLearners(moduleId: string, limit = 5) {
  let enrollments: any[] = [];
  try {
    enrollments = await EnrollmentModel.find({
      moduleId: new Types.ObjectId(moduleId),
    })
      .sort({ progressPercent: -1 })
      .limit(limit)
      .populate('citizenId', 'firstName lastName');
  } catch {
    return [];
  }

  return enrollments.map((e) => {
    const user: any = e.citizenId;
    const name = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'Unknown';
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');

    return {
      id: String(e._id),
      name,
      initials,
      color: colorFromString(name),
      progressPercentage: e.progressPercent,
      topicsCompleted: e.lessonsCompleted?.length ?? 0,
      certificateEarned: e.status === 'complete',
    };
  });
}

//  COMMENTS 

export async function getComments(
  moduleId: string, topicId: string, resolved?: boolean
) {
  const filter: Record<string, unknown> = {
    moduleId,
    topicId,
    parentId: null,
  };
  if (resolved !== undefined) filter.resolved = resolved;

  const topLevel = await CommentModel.find(filter).sort({ createdAt: -1 });
  const ids = topLevel.map((c) => c._id);

  const replies = await CommentModel.find({ parentId: { $in: ids } }).sort({ createdAt: 1 });
  const replyMap = new Map<string, any[]>();
  for (const r of replies) {
    const pid = String((r as any).parentId);
    if (!replyMap.has(pid)) replyMap.set(pid, []);
    replyMap.get(pid)!.push(r);
  }

  return topLevel.map((c) =>
    toCommentDto(c, replyMap.get(String(c._id)) ?? [])
  );
}

export async function resolveComment(
  moduleId: string, topicId: string, commentId: string,
  resolved: boolean, adminName: string
) {
  const doc = await CommentModel.findOne({ _id: commentId, topicId, moduleId });
  if (!doc) throw new AppError('Comment not found.', 404, 'NOT_FOUND');

  const updates: Record<string, unknown> = { resolved };
  if (resolved) {
    updates.resolvedBy = adminName;
    updates.resolvedAt = new Date();
  } else {
    updates.resolvedBy = undefined;
    updates.resolvedAt = undefined;
  }

  const updated = await CommentModel.findByIdAndUpdate(commentId, updates, { new: true });
  return toCommentDto(updated!);
}

export async function deleteComment(moduleId: string, topicId: string, commentId: string) {
  const doc = await CommentModel.findOne({ _id: commentId, topicId, moduleId });
  if (!doc) throw new AppError('Comment not found.', 404, 'NOT_FOUND');

  // Delete comment + all its replies
  await Promise.all([
    CommentModel.findByIdAndDelete(commentId),
    CommentModel.deleteMany({ parentId: commentId }),
  ]);

  // Decrement topic comment count
  await TopicModel.findByIdAndUpdate(topicId, { $inc: { comments: -1 } });
}