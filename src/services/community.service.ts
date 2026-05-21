import { Types } from 'mongoose';
import { CommunityPostModel, CommunityCommentModel } from '../models/Community.model';
import { ModuleModel } from '../models/Module.model';
import { TopicModel } from '../models/Module.model';
import { SubTopicModel } from '../models/Module.model';
import { UserModel } from '../models/User.model';
import { LawyerProfileModel } from '../models/LawyerProfile.model';
import { AppError } from '../middleware/error';
import { 
  CreatePostInput, 
  CreateCommentInput,
  CommunityUser,
  CommunityReference,
  COMMUNITY_ROOMS,
  ICommunityPost
} from '../models/types/community.types';
import cloudinary from '../utils/cloudinary';

// Helper: Build community user object
async function buildCommunityUser(userId: Types.ObjectId): Promise<CommunityUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  let role: CommunityUser['role'] = 'citizen';
  let isVerified = false;
  let badge: string | undefined;
  let specialisms: [] = [];
  let yearsOfExperience: number | undefined;

  // Check if user is a lawyer
  const lawyerProfile = await LawyerProfileModel.findOne({ userId });
  if (lawyerProfile) {
    role = 'lawyer';
    isVerified = lawyerProfile.verificationStatus === 'verified';
    if (isVerified) {
      badge = 'Verified Lawyer';
      specialisms = lawyerProfile.specialisms;
      yearsOfExperience = new Date().getFullYear() - (lawyerProfile.yearOfCall || 0);
    }
  }

  // Check for admin role
  if (user.role === 'admin') {
    role = 'admin';
  }

  return {
    userId: user._id,
    name: user.firstName || user.email,
    email: user.email,
    avatar: user.avatarUrl,
    role,
    isVerified,
    badge,
    specialisms,
    yearsOfExperience,
  };
}

// Helper: Build reference object
async function buildReference(referenceInput: CreatePostInput['reference']): Promise<CommunityReference | undefined> {
  if (!referenceInput) return undefined;

  const { type, id, title, moduleId, moduleTitle, topicId, topicTitle } = referenceInput;

  let referenceModel = '';
  let slug = '';
  let excerpt = '';
  let thumbnail = '';

  // Fetch additional details based on type
  if (type === 'module') {
    const module = await ModuleModel.findById(id);
    if (module) {
      slug = module.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      excerpt = module.description?.substring(0, 200);
      thumbnail = module.thumbnail || undefined;
      referenceModel = 'AdminModule';
    }
  } else if (type === 'topic') {
    const topic = await TopicModel.findById(id);
    if (topic) {
      slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      excerpt = topic.overview?.substring(0, 200);
      thumbnail = topic.thumbnailUrl || undefined;
      referenceModel = 'AdminTopic';
    }
  } else if (type === 'subtopic') {
    const subtopic = await SubTopicModel.findById(id);
    if (subtopic) {
      slug = subtopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      excerpt = subtopic.notes?.substring(0, 200);
      referenceModel = 'AdminSubTopic';
    }
  }

  return {
    type,
    id: new Types.ObjectId(id),
    referenceModel,
    title,
    slug,
    moduleId: moduleId ? new Types.ObjectId(moduleId) : undefined,
    moduleTitle,
    topicId: topicId ? new Types.ObjectId(topicId) : undefined,
    topicTitle,
    excerpt,
    thumbnail,
  };
}

// Helper: Sort posts
function sortPosts(posts: any[], sort: string) {
  switch (sort) {
    case 'popular':
      return posts.sort((a, b) => b.likes - a.likes);
    case 'trending':
      return posts.sort((a, b) => {
        const aScore = (a.likes * 0.3) + (a.commentCount * 0.7);
        const bScore = (b.likes * 0.3) + (b.commentCount * 0.7);
        return bScore - aScore;
      });
    case 'unanswered':
      return posts.filter(p => p.commentCount === 0);
    default:
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// ──────────────────────────────────────────────────────────────────
// MAIN SERVICE FUNCTIONS
// ──────────────────────────────────────────────────────────────────

// GET /community/posts
export async function listPosts(query: any) {
  const { room = "general", sort = 'latest', search, tag, page = 1, pageSize = 20 } = query;
  
  const filter: any = {};
  
  if (room && COMMUNITY_ROOMS[room]) {
    filter.room = room;
  }
  
  if (search) {
    filter.$text = { $search: search };
  }
  
  if (tag) {
    filter.tags = tag;
  }
  
  const skip = (page - 1) * pageSize;
  
  // Build query with sorting
  let dbQuery = CommunityPostModel.find(filter);
  
  if (sort === 'latest') {
    dbQuery = dbQuery.sort({ isPinned: -1, createdAt: -1 });
  } else {
    dbQuery = dbQuery.sort({ isPinned: -1, lastActivityAt: -1 });
  }
  
  const [posts, total] = await Promise.all([
    dbQuery.skip(skip).limit(pageSize).lean(),
    CommunityPostModel.countDocuments(filter),
  ]);
  
  // Fetch comment counts for each post
  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const commentCount = await CommunityCommentModel.countDocuments({ postId: post._id });
      return { ...post, commentCount };
    })
  );
  
  let sortedPosts = sortPosts(postsWithComments, sort);
  
  // Apply unanswered filter after counting
  if (sort === 'unanswered') {
    sortedPosts = sortedPosts.filter(p => p.commentCount === 0);
  }
  
  return {
    data: sortedPosts,
    total: sort === 'unanswered' ? sortedPosts.length : total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// GET /community/posts/:postId
export async function getPostById(postId: string, userId?: string) {
  const post = await CommunityPostModel.findById(postId).lean<ICommunityPost>();
  
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  // Increment view count
  await CommunityPostModel.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
  
  // Get comments with nested replies
  const comments = await CommunityCommentModel.find({ 
    postId: new Types.ObjectId(postId), 
    parentId: null 
  })
    .sort({ isAcceptedAnswer: -1, createdAt: 1 })
    .lean();
  
  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await CommunityCommentModel.find({ 
        parentId: comment._id 
      }).sort({ createdAt: 1 }).lean();
      
      return { ...comment, replies };
    })
  );
  
  // Check if user has liked the post
  let likedByUser = false;
  if (userId) {
    likedByUser = post.likedBy?.some((id:any) => id.toString() === userId) || false;
  }
  
  return {
    ...post,
    likedByUser,
    comments: commentsWithReplies,
    commentCount: commentsWithReplies.length,
  };
}

// POST /community/posts
export async function createPost(userId: string, input: CreatePostInput, files?: string[]) {
  // Get user details
  const author = await buildCommunityUser(new Types.ObjectId(userId));
  
  // Check room permissions
  const roomConfig = COMMUNITY_ROOMS[input.room];
  if (!roomConfig.allowedRoles.includes(author.role)) {
    throw new AppError(`You don't have permission to post in ${roomConfig.name}`, 403, 'PERMISSION_DENIED');
  }
  
  // Build reference if provided
  const reference = await buildReference(input.reference);
  
  // Upload images
  const imageUrls =files ? await cloudinary.uploadMultipleImages(files, 'community') : [];
  
  const post = await CommunityPostModel.create({
    title: input.title,
    content: input.content,
    author,
    room: input.room,
    reference: reference || null,
    tags: input.tags,
    images: imageUrls,
    likes: 0,
    likedBy: [],
    comments: [],
    commentCount: 0,
    viewCount: 0,
    isPinned: false,
    isLocked: false,
    isResolved: false,
    lastActivityAt: new Date(),
  });
  
  return post;
}

// POST /community/posts/:postId/comments
export async function createComment(
  postId: string, 
  userId: string, 
  input: CreateCommentInput, 
  files?: string[]
) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  if (post.isLocked) {
    throw new AppError('This post is locked. No new comments allowed.', 403, 'POST_LOCKED');
  }
  
  // Get user details
  const author = await buildCommunityUser(new Types.ObjectId(userId));
  
  // Check if this is a lawyer answering
  let isLawyerAnswer = false;
  if (author.role === 'lawyer' && post.room === 'legal-advice') {
    isLawyerAnswer = true;
  }
  
  // Upload images
  const imageUrls = files ? await cloudinary.uploadMultipleImages(files, 'community') : [];
  console.log(imageUrls)
  
  const comment = await CommunityCommentModel.create({
    postId: new Types.ObjectId(postId),
    content: input.content,
    author,
    images: imageUrls,
    likes: 0,
    likedBy: [],
    parentId: input.parentId ? new Types.ObjectId(input.parentId) : null,
    replies: [],
    isLawyerAnswer,
    isAcceptedAnswer: false,
  });
  
  // Update post comment count and last activity
  await CommunityPostModel.findByIdAndUpdate(postId, {
    $push: { comments: comment._id },
    $inc: { commentCount: 1 },
    $set: { lastActivityAt: new Date() }
  });
  
  // If this is a reply, update parent comment's replies array
  if (input.parentId) {
    await CommunityCommentModel.findByIdAndUpdate(input.parentId, {
      $push: { replies: comment._id }
    });
  }
  
  return comment;
}

// POST /community/posts/:postId/like
export async function toggleLikePost(postId: string, userId: string) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const userIdObj = new Types.ObjectId(userId);
  const hasLiked = post.likedBy?.some((id:any) => id.equals(userIdObj));
  
  if (hasLiked) {
    // Unlike
    await CommunityPostModel.findByIdAndUpdate(postId, {
      $pull: { likedBy: userIdObj },
      $inc: { likes: -1 }
    });
    return { liked: false, likes: post.likes - 1 };
  } else {
    // Like
    await CommunityPostModel.findByIdAndUpdate(postId, {
      $push: { likedBy: userIdObj },
      $inc: { likes: 1 }
    });
    return { liked: true, likes: post.likes + 1 };
  }
}

// POST /community/posts/:postId/comments/:commentId/like
export async function toggleLikeComment(postId: string, commentId: string, userId: string) {
  const comment = await CommunityCommentModel.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  
  const userIdObj = new Types.ObjectId(userId);
  const hasLiked = comment.likedBy?.some((id:any) => id.equals(userIdObj));
  
  if (hasLiked) {
    await CommunityCommentModel.findByIdAndUpdate(commentId, {
      $pull: { likedBy: userIdObj },
      $inc: { likes: -1 }
    });
    return { liked: false, likes: comment.likes - 1 };
  } else {
    await CommunityCommentModel.findByIdAndUpdate(commentId, {
      $push: { likedBy: userIdObj },
      $inc: { likes: 1 }
    });
    return { liked: true, likes: comment.likes + 1 };
  }
}

// POST /community/posts/:postId/comments/:commentId/accept (Admin/Lawyer)
export async function acceptAnswer(postId: string, commentId: string, userId: string, adminCtx?: any) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const user = await UserModel.findById(userId);
  const isAdmin = user?.role === 'admin' || adminCtx;
  const isOriginalPoster = post.author.userId.toString() === userId;
  
  if (!isAdmin && !isOriginalPoster) {
    throw new AppError('Only the post author or admin can accept answers', 403, 'PERMISSION_DENIED');
  }
  
  // Remove previously accepted answer
  await CommunityCommentModel.updateMany(
    { postId: new Types.ObjectId(postId), isAcceptedAnswer: true },
    { $set: { isAcceptedAnswer: false } }
  );
  
  // Accept new answer
  await CommunityCommentModel.findByIdAndUpdate(commentId, { $set: { isAcceptedAnswer: true } });
  
  // Mark post as resolved
  await CommunityPostModel.findByIdAndUpdate(postId, {
    $set: { isResolved: true, resolvedBy: new Types.ObjectId(userId), resolvedAt: new Date() }
  });
  
  return { message: 'Answer accepted successfully' };
}

// POST /community/posts/:postId/pin (Admin only)
export async function pinPost(postId: string, adminCtx: any) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const newPinnedState = !post.isPinned;
  await CommunityPostModel.findByIdAndUpdate(postId, { $set: { isPinned: newPinnedState } });
  
  return { 
    message: newPinnedState ? 'Post pinned successfully' : 'Post unpinned successfully',
    isPinned: newPinnedState 
  };
}

// POST /community/posts/:postId/lock (Admin/Moderator only)
export async function lockPost(postId: string, adminCtx: any) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const newLockState = !post.isLocked;
  await CommunityPostModel.findByIdAndUpdate(postId, { $set: { isLocked: newLockState } });
  
  return { 
    message: newLockState ? 'Post locked successfully' : 'Post unlocked successfully',
    isLocked: newLockState 
  };
}

// POST /community/posts/:postId/resolve
export async function resolvePost(postId: string, userId: string) {
  const post = await CommunityPostModel.findById(postId);
  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  const isAuthor = post.author.userId.toString() === userId;
  if (!isAuthor) {
    throw new AppError('Only the post author can mark it as resolved', 403, 'PERMISSION_DENIED');
  }
  
  const newResolvedState = !post.isResolved;
  await CommunityPostModel.findByIdAndUpdate(postId, {
    $set: { 
      isResolved: newResolvedState,
      resolvedAt: newResolvedState ? new Date() : null,
      resolvedBy: newResolvedState ? new Types.ObjectId(userId) : null
    }
  });
  
  return { 
    message: newResolvedState ? 'Post marked as resolved' : 'Post reopened',
    isResolved: newResolvedState 
  };
}

// GET /community/rooms
export async function getRooms() {
  return Object.entries(COMMUNITY_ROOMS).map(([id, config]) => ({
    id,
    ...config,
  }));
}

// GET /community/reference/:type/:id
export async function getPostsByReference(type: string, id: string) {
  const posts = await CommunityPostModel.find({
    'reference.type': type,
    'reference.id': new Types.ObjectId(id)
  })
    .sort({ createdAt: -1 })
    .lean();
  
  return posts;
}