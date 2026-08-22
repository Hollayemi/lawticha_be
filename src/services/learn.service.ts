import { Types } from 'mongoose';
import { ModuleModel, TopicModel, SubTopicModel, ModuleCategory } from '../models/Module.model';
import { EnrollmentModel, UserProgressModel } from '../models/Enrollment.model';
import { StudySessionModel } from '../models/StudySession.model';
import { UserModel } from '../models/User.model';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { AppError } from '../middleware/error';
import { generateSlug } from '../utils/functions';
import NotificationController from '../controllers/others/notification';

// Types
export type LearnTabKey = 'all' | 'active' | 'complete' | 'saved';
export type LearnModuleStatus = 'active' | 'inactive';
export type LearnTopicStatus = 'published' | 'draft';

export interface ListLearnModulesParams {
  tab?: LearnTabKey;
  search?: string;
  category?: ModuleCategory | 'all';
  page?: number;
  pageSize?: number;
  citizenId?: string;
}

export interface LearnInstructor {
  _id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

export interface LearnModule {
  _id: string;
  slug: string;
  title: string;
  description: string;
  category: ModuleCategory;
  categoryLabel: string;
  categoryColor: string;
  categoryBg: string;
  status: LearnModuleStatus;
  thumbnailUrl: string | null;
  gradient: string;
  tag: string;
  tagColor: string;
  price: 'Free' | string;
  instructor: LearnInstructor;
  rating: number;
  reviewCount: number;
  weeksDuration: number;
  lessonCount: number;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
  enrolledAt?: string | null;
  progressPercent?: number;
  userTab?: LearnTabKey;
  isSaved?: boolean;
}

// Helper: Get category metadata
function getCategoryMetadata(category: ModuleCategory): {
  label: string;
  color: string;
  bg: string;
} {
  const metadata: Record<ModuleCategory, { label: string; color: string; bg: string }> = {
    criminal: { label: 'Criminal Law', color: '#DC2626', bg: '#FEE2E2' },
    tenancy: { label: 'Tenancy Law', color: '#D97706', bg: '#FEF3C7' },
    employment: { label: 'Employment Law', color: '#059669', bg: '#D1FAE5' },
    contracts: { label: 'Contract Law', color: '#2563EB', bg: '#DBEAFE' },
    business: { label: 'Business Law', color: '#7C3AED', bg: '#EDE9FE' },
    family: { label: 'Family Law', color: '#DB2777', bg: '#FCE7F3' },
    consumer: { label: 'Consumer Law', color: '#EA580C', bg: '#FFEDD5' },
    road: { label: 'Road Traffic Law', color: '#0891B2', bg: '#CFFAFE' },
  };
  return metadata[category];
}

// Helper: Get gradient from thumbnail or generate from category
function getGradient(thumbnailUrl: string | null, category: ModuleCategory): string {
  if (thumbnailUrl) return `url(${thumbnailUrl})`;
  const gradients: Record<ModuleCategory, string> = {
    criminal: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    tenancy: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
    employment: 'linear-gradient(135deg, #059669 0%, #065F46 100%)',
    contracts: 'linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%)',
    business: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    family: 'linear-gradient(135deg, #DB2777 0%, #BE185D 100%)',
    consumer: 'linear-gradient(135deg, #EA580C 0%, #9A3412 100%)',
    road: 'linear-gradient(135deg, #0891B2 0%, #155E75 100%)',
  };
  return gradients[category];
}

// Helper: Get instructor data
async function getInstructorData(instructorId: Types.ObjectId): Promise<LearnInstructor> {
  const lawyer = await LawyerProfileModel.findOne({ userId: instructorId }).populate('userId', 'firstName lastName email');

  if (lawyer && lawyer.userId) {
    const user = lawyer.userId as any;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    return {
      _id: instructorId.toString(),
      name: name || 'Legal Expert',
      email: user.email || '',
      initials: firstName.charAt(0) + lastName.charAt(0) || 'LE',
      color: '#1E3A5F',
    };
  }

  return {
    _id: instructorId.toString(),
    name: 'Legal Expert',
    email: '',
    initials: 'LE',
    color: '#1E3A5F',
  };
}

// Helper: Calculate weeks duration from topics
async function calculateWeeksDuration(moduleId: Types.ObjectId): Promise<number> {
  const topics = await TopicModel.find({ moduleId, status: 'published' });
  const totalMinutes = topics.reduce((sum, t) => sum + (t.durationSeconds / 60), 0);
  return Math.ceil(totalMinutes / 60); // Assume 1 hour per week
}

// Main service functions
export async function listLearnModules(params: ListLearnModulesParams) {
  const {
    tab,
    search,
    category,
    page = 1,
    pageSize = 20,
    citizenId,
  } = params;

  const currentPage = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Number(pageSize) || 20);
  const skip = (currentPage - 1) * limit;

  const searchTerm = search?.trim();

  // ----------------------------------------
  // 1. Build the base module filter
  // ----------------------------------------

  const filter: any = {
    status: "active",
  };

  if (category && category !== "all") {
    filter.category = category;
  }

  // Use text search if a search term exists.
  if (searchTerm) {
    filter.$text = {
      $search: searchTerm,
    };
  }

  // ----------------------------------------
  // 2. Get citizen enrollment information
  // ----------------------------------------

  let enrollmentMap = new Map<string, any>();
  let savedModuleIds = new Set<string>();

  if (citizenId) {
    const citizenObjectId = new Types.ObjectId(citizenId);

    const enrollments = await EnrollmentModel.find({
      citizenId: citizenObjectId,
    }).lean();

    for (const enrollment of enrollments) {
      const moduleId = enrollment.moduleId.toString();

      enrollmentMap.set(moduleId, enrollment);

      if (enrollment.isSaved === true) {
        savedModuleIds.add(moduleId);
      }
    }
  }

  // ----------------------------------------
  // 3. Get modules matching the database filters
  // ----------------------------------------

  let modulesQuery = ModuleModel.find(filter);

  // Search results should be ordered by relevance.
  if (searchTerm) {
    modulesQuery = modulesQuery
      .select({
        score: {
          $meta: "textScore",
        },
      })
      .sort({
        score: {
          $meta: "textScore",
        },
        trending: -1,
        createdAt: -1,
      });
  } else {
    modulesQuery = modulesQuery.sort({
      trending: -1,
      createdAt: -1,
    });
  }

  const allMatchingModules = await modulesQuery.lean();

  // ----------------------------------------
  // 4. Apply user-specific tab filtering
  // ----------------------------------------

  let filteredModules = allMatchingModules;

  if (tab && tab !== "all") {
    filteredModules = allMatchingModules.filter((module) => {
      const moduleId = String(module._id);
      const enrollment = enrollmentMap.get(moduleId);

      if (tab === "active") {
        return enrollment?.status === "active";
      }

      if (tab === "complete") {
        return enrollment?.status === "complete";
      }

      if (tab === "saved") {
        return savedModuleIds.has(moduleId);
      }

      return true;
    });
  }

  // ----------------------------------------
  // 5. Calculate total BEFORE pagination
  // ----------------------------------------

  const total = filteredModules.length;

  const totalPages = Math.ceil(total / limit);

  // ----------------------------------------
  // 6. Apply pagination AFTER all filters
  // ----------------------------------------

  const paginatedModules = filteredModules.slice(
    skip,
    skip + limit
  );

  // ----------------------------------------
  // 7. Transform modules
  // ----------------------------------------

  const transformedModules: LearnModule[] = await Promise.all(
    paginatedModules.map(async (module: any) => {
      const moduleId = module._id.toString();

      const enrollment = enrollmentMap.get(moduleId);

      const isSaved = savedModuleIds.has(moduleId);

      const categoryMeta = getCategoryMetadata(module.category);

      const instructor = await getInstructorData(
        module.instructorId
      );

      const weeksDuration = await calculateWeeksDuration(
        module._id
      );

      let userTab: LearnTabKey | undefined;

      if (enrollment) {
        if (enrollment.status === "complete") {
          userTab = "complete";
        } else if (enrollment.status === "active") {
          userTab = "active";
        } else if (enrollment.isSaved) {
          userTab = "saved";
        }
      } else if (isSaved) {
        userTab = "saved";
      }

      return {
        _id: moduleId,
        slug: generateSlug(module.title),

        title: module.title,
        description: module.description,

        category: module.category,
        categoryLabel: categoryMeta.label,
        categoryColor: categoryMeta.color,
        categoryBg: categoryMeta.bg,

        status: module.status as LearnModuleStatus,

        thumbnailUrl: module.thumbnail,

        gradient: getGradient(
          module.thumbnail,
          module.category
        ),

        tag: categoryMeta.label.split(" ")[0],
        tagColor: categoryMeta.color,

        price: "Free",

        instructor,

        rating: module.avgRating,
        reviewCount: module.reviewCount,

        weeksDuration,
        lessonCount: module.topicCount,

        trending: module.trending,

        createdAt: module.createdAt.toISOString(),
        updatedAt: module.updatedAt.toISOString(),

        enrolledAt:
          enrollment?.startedAt?.toISOString(),

        progressPercent:
          enrollment?.progressPercent || 0,

        userTab,
        isSaved,
      };
    })
  );

  // ----------------------------------------
  // 8. Return result
  // ----------------------------------------

  return {
    data: transformedModules,
    total,
    page: currentPage,
    pageSize: limit,
    totalPages,
  };
}

export async function getFullMaterialByModuleSlug(slug: string) {

  if (!slug) {
    throw new AppError('Module Slug is required', 404, 'SLUG_NOT_FOUND');
  }

  const module = await ModuleModel.findOne({ slug });
  console.log(slug, { module })
  if (!module) {
    throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
  }

  // Find all topics for this module
  const topics = await TopicModel.find({ moduleId: module._id })
    .sort({ order: 1 })

  // Get all subtopics for all topics in this module
  const topicIds = topics.map(topic => topic._id);
  const subtopics = await SubTopicModel.find({
    topicId: { $in: topicIds },
    moduleId: module._id
  })
    .sort({ order: 1 })
    .lean();

  // Group subtopics by topicId
  const subtopicsByTopic = subtopics.reduce((acc, subtopic) => {
    const topicId = subtopic.topicId.toString();
    if (!acc[topicId]) {
      acc[topicId] = [];
    }
    acc[topicId].push(subtopic);
    return acc;
  }, {} as Record<string, typeof subtopics>);

  // Build the hierarchical response
  const material = {
    module: {
      _id: module._id,
      title: module.title,
      slug: module.slug,
      category: module.category,
      status: module.status,
      description: module.description,
      instructor: module.instructor,
      thumbnail: module.thumbnail,
      topicCount: module.topicCount,
      enrolledCount: module.enrolledCount,
      completionRate: module.completionRate,
      avgRating: module.avgRating,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    },
    topics: topics.map(topic => ({
      _id: topic._id,
      title: topic.title,
      slug: topic.slug,
      classification: topic.classification,
      overview: topic.overview,
      status: topic.status,
      order: topic.order,
      videoType: topic.videoType,
      videoUrl: topic.videoUrl,
      thumbnailUrl: topic.thumbnailUrl,
      duration: topic.duration,
      durationSeconds: topic.durationSeconds,
      watchCount: topic.watchCount,
      completionRate: topic.completionRate,
      likes: topic.likes,
      comments: topic.comments,
      tags: topic.tags,
      subtopicCount: topic.subtopicCount,
      subtopics: (subtopicsByTopic[topic._id.toString()] || []).map(subtopic => ({
        _id: subtopic._id,
        title: subtopic.title,
        slug: subtopic.slug,
        notes: subtopic.notes,
        duration: subtopic.duration,
        durationSeconds: subtopic.durationSeconds,
        order: subtopic.order,
        viewCount: subtopic.viewCount,
        completedBy: subtopic.completedBy,
        createdAt: subtopic.createdAt,
        updatedAt: subtopic.updatedAt
      }))
    }))
  };

  return material
};


export async function generateAndSaveSummary(slug: string, max_words: number = 500) {
  console.log({ slug, max_words })
  const response = await fetch('https://material-summary.onrender.com/api/v1/summary/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug,
      max_words: max_words
    })
  });
  if (!response.ok) {
    const errorData = await response.json() as any;
    console.log(errorData.detail)
    throw new AppError(`HTTP error! status: ${response.status}`, 500, 'FAILED TO GENERATE');
  }

  const data = await response.json() as any;
  await ModuleModel.findOneAndUpdate({ slug }, { $set: { materialSummary:data } });

  // Log the summary for debugging
  console.log('Summary generated for:', data.module_title);
  console.log('Total words:', data.total_word_count);
  console.log('Topics:', data.topics.map((t: any) => t.title).join(', '));

  return data;

}

export async function getLearnModuleBySlug(slug: string, citizenId?: string) {
  // Find module by title (slug is generated from title)
  const modules = await ModuleModel.find({ status: 'active' });
  const module = modules.find(m => generateSlug(m.title) === slug);

  if (!module) {
    throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
  }

  // Get topics
  const topics = await TopicModel.find({ moduleId: module._id, status: 'published' })
    .sort({ order: 1 });

  // Get enrollment data if citizen is authenticated
  let enrollment = null;
  let completedTopics: Set<string> = new Set();
  let activeTopicId: string | null = null;

  if (citizenId) {
    enrollment = await EnrollmentModel.findOne({
      citizenId: new Types.ObjectId(citizenId),
      moduleId: module._id,
    });

    const userProgress = await UserProgressModel.find({
      citizenId: new Types.ObjectId(citizenId),
      moduleId: module._id,
      status: 'done',
    });

    for (const progress of userProgress) {
      completedTopics.add(progress.lessonId.toString());
    }

    // Find active topic (first incomplete or current lesson)
    if (enrollment?.currentLessonId) {
      activeTopicId = enrollment.currentLessonId.toString();
    } else {
      for (const topic of topics) {
        if (!completedTopics.has(topic._id.toString())) {
          activeTopicId = topic._id.toString();
          break;
        }
      }
    }
  }

  const categoryMeta = getCategoryMetadata(module.category);
  const instructor = await getInstructorData(module.instructorId);
  const weeksDuration = await calculateWeeksDuration(module._id);

  // Calculate total watch time
  const totalWatchTimeMinutes = topics.reduce((sum, t) => sum + (t.durationSeconds / 60), 0);

  const topicSummaries = topics.map((topic, index) => ({
    _id: topic._id.toString(),
    slug: generateSlug(topic.title),
    title: topic.title,
    order: topic.order,
    duration: topic.duration,
    status: topic.status as LearnTopicStatus,
    completed: completedTopics.has(topic._id.toString()),
    active: activeTopicId === topic._id.toString(),
  }));

  return {
    _id: module._id.toString(),
    slug: generateSlug(module.title),
    title: module.title,
    materialSummary: module.materialSummary,
    description: module.description,
    fullDescription: module.description,
    category: module.category,
    categoryLabel: categoryMeta.label,
    categoryColor: categoryMeta.color,
    categoryBg: categoryMeta.bg,
    status: module.status as LearnModuleStatus,
    thumbnailUrl: module.thumbnail,
    gradient: getGradient(module.thumbnail, module.category),
    tag: categoryMeta.label.split(' ')[0],
    tagColor: categoryMeta.color,
    price: 'Free',
    instructor,
    rating: module.avgRating,
    reviewCount: module.reviewCount,
    weeksDuration,
    lessonCount: module.topicCount,
    trending: module.trending,
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
    enrolledAt: enrollment?.startedAt?.toISOString(),
    progressPercent: enrollment?.progressPercent || 0,
    userTab: enrollment?.status === 'complete' ? 'complete' : enrollment?.status === 'active' ? 'active' : undefined,
    isSaved: enrollment?.isSaved || false,
    topics: topicSummaries,
    totalWatchTimeMinutes,
    enrolledCount: module.enrolledCount,
    completionRate: module.completionRate,
  };
}

export async function getLearnTopicBySlug(moduleSlug: string, topicSlug: string, citizenId?: string) {
  // Find module by slug
  const modules = await ModuleModel.find({ status: 'active' });
  const module = modules.find(m => generateSlug(m.title) === moduleSlug);

  if (!module) {
    throw new AppError('Module not found', 404, 'MODULE_NOT_FOUND');
  }

  // Find topic by slug
  const topics = await TopicModel.find({ moduleId: module._id });
  const topic = topics.find(t => generateSlug(t.title) === topicSlug);

  if (!topic) {
    throw new AppError('Topic not found', 404, 'TOPIC_NOT_FOUND');
  }

  // Get subtopics
  const subtopics = await SubTopicModel.find({ topicId: topic._id, moduleId: module._id })
    .sort({ order: 1 });

  // Get enrollment and progress data
  let enrollment = null;
  let isCompleted = false;
  let progressPercent = 0;
  let currentTime = '0:00';
  let currentTimeSeconds = 0;

  if (citizenId) {
    enrollment = await EnrollmentModel.findOne({
      citizenId: new Types.ObjectId(citizenId),
      moduleId: module._id,
    });

    const userProgress = await UserProgressModel.findOne({
      citizenId: new Types.ObjectId(citizenId),
      lessonId: topic._id,
    });

    if (userProgress) {
      isCompleted = userProgress.status === 'done';
      currentTimeSeconds = userProgress.videoPositionSeconds || 0;
      const minutes = Math.floor(currentTimeSeconds / 60);
      const seconds = currentTimeSeconds % 60;
      currentTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      progressPercent = (currentTimeSeconds / topic.durationSeconds) * 100;
    }
  }

  const instructor = await getInstructorData(module.instructorId);

  const subtopicSummaries = subtopics.map((subtopic, index) => ({
    _id: subtopic._id.toString(),
    title: subtopic.title,
    order: subtopic.order,
    duration: subtopic.duration,
    // completed: subtopic.completedBy.includes(citizenId || ''),
    notes: subtopic.notes,
    completedBy: subtopic.completedBy,
  }));

  return {
    _id: topic._id.toString(),
    slug: generateSlug(topic.title),
    moduleId: module._id.toString(),
    moduleTitle: module.title,
    moduleSlug: generateSlug(module.title),
    title: topic.title,
    tag: module.category,
    tagColor: getCategoryMetadata(module.category).color,
    classification: topic.classification,
    overview: topic.overview,
    status: topic.status as LearnTopicStatus,
    order: topic.order,
    videoType: topic.videoType,
    videoUrl: topic.videoUrl,
    thumbnailUrl: topic.thumbnailUrl,
    duration: topic.duration,
    durationSeconds: topic.durationSeconds,
    currentTime,
    progressPercent,
    watchCount: topic.watchCount,
    completionRate: topic.completionRate,
    likes: topic.likes,
    comments: topic.comments,
    rating: 0,
    instructor,
    weeksDuration: Math.ceil(topic.durationSeconds / 3600),
    lessonCount: 1,
    subtopics: subtopicSummaries,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    completed: isCompleted,
  };
}

export async function getContinueReading(citizenId: string) {
  const enrollments = await EnrollmentModel.find({
    citizenId: new Types.ObjectId(citizenId),
    status: 'active',
  })
    .sort({ lastActivityAt: -1 })
    .limit(2)
    .populate('moduleId');

  const result = [];

  for (const enrollment of enrollments) {
    const module = enrollment.moduleId as any;
    if (!module) continue;

    // Get current topic
    let currentSectionTitle = 'Getting Started';
    if (enrollment.currentLessonTitle) {
      currentSectionTitle = enrollment.currentLessonTitle;
    } else {
      const firstTopic = await TopicModel.findOne({ moduleId: module._id }).sort({ order: 1 });
      if (firstTopic) {
        currentSectionTitle = firstTopic.title;
      }
    }

    const lastReadLabel = getRelativeTimeLabel(enrollment.lastActivityAt);

    result.push({
      slug: generateSlug(module.title),
      moduleSlug: generateSlug(module.title),
      title: module.title,
      tag: module.category,
      tagColor: getCategoryMetadata(module.category).color,
      gradient: getGradient(module.thumbnail, module.category),
      progressPercent: enrollment.progressPercent,
      lastReadAt: enrollment.lastActivityAt.toISOString(),
      lastReadLabel,
      currentSectionTitle,
      xpRewardOnCompletion: 100,
    });
  }

  return result;
}

export async function getFeaturedTopics(): Promise<any[]> {
  const topics = await TopicModel.find({ status: 'published' }).populate("moduleId", "title")
    .sort({ watchCount: -1 })
    .limit(4)
    .populate('moduleId');

  const result = [];

  for (const topic of topics) {
    console.log(topic.moduleId);
    const module = topic.moduleId._id as any;
    const instructor = await getInstructorData(module);

    result.push({
      _id: topic._id.toString(),
      module: generateSlug(topic.moduleId.title),
      slug: generateSlug(topic.title),
      title: topic.title,
      instructor: {
        name: instructor.name,
        email: instructor.email,
        initials: instructor.initials,
        color: instructor.color,
      },
    });
  }

  return result;
}

export async function toggleSaveModule(moduleId: string, citizenId: string) {
  const enrollment = await EnrollmentModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
  });

  if (enrollment) {
    enrollment.isSaved = !enrollment.isSaved;
    if (enrollment.isSaved && enrollment.status === 'active') {
      enrollment.status = 'saved';
    } else if (!enrollment.isSaved && enrollment.status === 'saved') {
      enrollment.status = 'active';
    }
    await enrollment.save();
    return { moduleId, saved: enrollment.isSaved };
  }

  // Create new enrollment as saved
  const newEnrollment = new EnrollmentModel({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
    status: 'saved',
    isSaved: true,
    startedAt: new Date(),
    lastActivityAt: new Date(),
  });
  await newEnrollment.save();

  return { moduleId, saved: true };
}

export async function enrolInModule(moduleId: string, citizenId: string) {
  const existingEnrollment = await EnrollmentModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
  });

  if (existingEnrollment) {
    if (existingEnrollment.status === 'saved') {
      existingEnrollment.status = 'active';
      existingEnrollment.isSaved = false;
      await existingEnrollment.save();
    }
    
    // Notify user of enrollment continuation
    await NotificationController.saveAndSendNotification({
      userId: citizenId,
      title: '📚 Continuing Your Module',
      body: 'You\'re already enrolled in this module. Keep learning!',
      type: 'enrollment_continued',
      clickUrl: `/learn/modules/${moduleId}`,
      priority: 'low'
    }, 'user', { push_notification: true });
    
    return {
      _id: moduleId,
      enrolledAt: existingEnrollment.startedAt.toISOString(),
      progressPercent: existingEnrollment.progressPercent,
      userTab: existingEnrollment.status,
    };
  }

  const enrollment = new EnrollmentModel({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
    status: 'active',
    startedAt: new Date(),
    lastActivityAt: new Date(),
  });
  await enrollment.save();

  // Update module enrolled count
  await ModuleModel.findByIdAndUpdate(moduleId, {
    $inc: { enrolledCount: 1 },
  });

  // Get module title for notification
  const module = await ModuleModel.findById(moduleId);
  
  // Notify user of enrollment
  await NotificationController.saveAndSendNotification({
    userId: citizenId,
    title: '🎓 New Module Enrolled',
    body: `You have successfully enrolled in "${module?.title || 'Module'}". Start learning now!`,
    type: 'module_enrolled',
    clickUrl: `/learn/modules/${moduleId}`,
    priority: 'medium'
  }, 'user', { push_notification: true });

  return {
    _id: moduleId,
    enrolledAt: enrollment.startedAt.toISOString(),
    progressPercent: 0,
    userTab: 'active',
  };
}

export async function markTopicComplete(moduleId: string, topicId: string, citizenId: string) {
  const enrollment = await EnrollmentModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
  });

  if (!enrollment) {
    throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  }

  // Check if already completed
  const existingProgress = await UserProgressModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    lessonId: new Types.ObjectId(topicId),
  });

  let xpAwarded = 0;
  let certificateUnlocked = false;

  if (!existingProgress || existingProgress.status !== 'done') {
    xpAwarded = 50; // XP for completing a topic

    // Create or update progress
    await UserProgressModel.findOneAndUpdate(
      {
        citizenId: new Types.ObjectId(citizenId),
        lessonId: new Types.ObjectId(topicId),
      },
      {
        citizenId: new Types.ObjectId(citizenId),
        moduleId: new Types.ObjectId(moduleId),
        lessonId: new Types.ObjectId(topicId),
        enrollmentId: enrollment._id,
        status: 'done',
        completedAt: new Date(),
        xpAwarded,
      },
      { upsert: true }
    );

    // Update enrollment progress
    const totalTopics = await TopicModel.countDocuments({
      moduleId: new Types.ObjectId(moduleId),
      status: 'published',
    });
    const completedTopics = await UserProgressModel.countDocuments({
      citizenId: new Types.ObjectId(citizenId),
      moduleId: new Types.ObjectId(moduleId),
      status: 'done',
    });

    const newProgressPercent = (completedTopics / totalTopics) * 100;
    enrollment.progressPercent = newProgressPercent;
    enrollment.lessonsCompleted.push(new Types.ObjectId(topicId));

    if (newProgressPercent >= 100) {
      enrollment.status = 'complete';
      enrollment.completedAt = new Date();
      certificateUnlocked = true;
    }

    await enrollment.save();

    // Record study session
    const topic = await TopicModel.findById(topicId);
    if (topic) {
      await StudySessionModel.create({
        citizenId: new Types.ObjectId(citizenId),
        moduleId: new Types.ObjectId(moduleId),
        lessonId: new Types.ObjectId(topicId),
        enrollmentId: enrollment._id,
        sessionType: 'study',
        durationMinutes: Math.ceil(topic.durationSeconds / 60),
        startedAt: new Date(),
        endedAt: new Date(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
    }

    // Notify user of topic completion
    await NotificationController.saveAndSendNotification({
      userId: citizenId,
      title: `✅ Topic Complete: ${topic?.title || 'Lesson'}`,
      body: `You completed a topic! +50 XP. Keep up the great work!`,
      type: 'topic_completed',
      clickUrl: `/learn/modules/${moduleId}`,
      priority: 'medium'
    }, 'user', { push_notification: true });
  }

  // If certificate unlocked, send celebration notification
  if (certificateUnlocked) {
    const module = await ModuleModel.findById(moduleId);
    await NotificationController.saveAndSendNotification({
      userId: citizenId,
      title: '🎉 Module Complete!',
      body: `Congratulations! You've completed "${module?.title || 'the module'}" and earned your certificate!`,
      type: 'module_completed',
      clickUrl: `/learn/modules/${moduleId}/certificate`,
      priority: 'high'
    }, 'user', { push_notification: true, email_notification: true });
  }

  // Get total XP for citizen
  const totalProgress = await UserProgressModel.aggregate([
    { $match: { citizenId: new Types.ObjectId(citizenId) } },
    { $group: { _id: null, total: { $sum: '$xpAwarded' } } },
  ]);
  const xpTotal = totalProgress[0]?.total || 0;

  // Get streak (simplified)
  const streakDays = 1;

  return {
    topicId,
    completed: true,
    xpTotal,
    xpAwarded,
    streakDays,
    moduleProgressPercent: enrollment.progressPercent,
    certificateUnlocked,
  };
}

export async function saveVideoProgress(
  moduleId: string,
  topicId: string,
  citizenId: string,
  currentTimeSeconds: number
) {
  const enrollment = await EnrollmentModel.findOne({
    citizenId: new Types.ObjectId(citizenId),
    moduleId: new Types.ObjectId(moduleId),
  });

  if (!enrollment) {
    throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  }

  await UserProgressModel.findOneAndUpdate(
    {
      citizenId: new Types.ObjectId(citizenId),
      lessonId: new Types.ObjectId(topicId),
    },
    {
      citizenId: new Types.ObjectId(citizenId),
      moduleId: new Types.ObjectId(moduleId),
      lessonId: new Types.ObjectId(topicId),
      enrollmentId: enrollment._id,
      videoPositionSeconds: currentTimeSeconds,
      status: 'active',
    },
    { upsert: true }
  );

  // Update enrollment last activity
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  return { topicId, currentTimeSeconds };
}

function getRelativeTimeLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}