import { Types } from 'mongoose';
import { CitizenProfileModel } from '../models/CitizenProfile.model';
import { EnrollmentModel } from '../models/Enrollment.model';
import { LegalModuleModel } from '../models/LegalModule.model';
import { BookmarkModel } from '../models/LegalAct.model';
import { TopicModel } from '../models/Module.model';
import {
  DailyChallengeModel,
  DailyChallengeAttemptModel,
} from '../models/Certificate.model';
import { CommunityPostModel } from '../models/Community.model';
import { GoalModel, CitizenGoalProgressModel } from '../models/Goal.model';
import { AppError } from '../middleware/error';
import { awardXP } from './citizen.service';
import { colorFromString } from '../utils/functions';

// ── Formatting helpers ─────────────────────────────────────────────────────

function timeAgo(date?: Date | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatReads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k reads`;
  return `${n} reads`;
}

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';
}

function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}

// ── Profile helper ─────────────────────────────────────────────────────────

async function getOrCreateProfile(userId: string) {
  let profile = await CitizenProfileModel.findOne({ userId });
  if (!profile) {
    profile = await CitizenProfileModel.create({ userId });
  }
  return profile;
}

// ── Section builders ───────────────────────────────────────────────────────

export async function getUserStats(userId: string) {
  const profile = await getOrCreateProfile(userId);
  return {
    topicsCompletedCount: profile.topicsCompletedCount,
    streakDays: profile.streakDays,
    certificatesCount: profile.certificatesCount,
    totalStudyMinutes: profile.totalStudyMinutes,
    xpTotal: profile.xpTotal,
    xpLevel: profile.xpLevel,
  };
}

export async function getContinueReading(userId: string, limit = 4) {
  const enrollments = await EnrollmentModel.find({
    citizenId: userId,
    status: 'active',
  })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .populate('moduleId');

  return enrollments
    .filter((e) => e.moduleId)
    .map((e) => {
      const mod = e.moduleId as any;
      const remainingXp = Math.max((mod.xpReward || 0) - (e.xpEarned || 0), 0);

      return {
        slug: mod.slug,
        icon: mod.iconEmoji || 'BookOpen',
        gradient: mod.gradient || 'linear-gradient(135deg, #0F5132 0%, #14532D 100%)',
        tag: mod.tag || '',
        tagColor: mod.tagColor || '#0F5132',
        title: mod.title,
        progress: e.progressPercent || 0,
        lastRead: timeAgo(e.lastActivityAt),
        section: e.currentLessonTitle || 'Get started',
        xpReward: remainingXp,
      };
    });
}

export async function getDailyChallenge(userId: string) {
  const { start, end } = todayRange();

  const challenge = await DailyChallengeModel.findOne({
    activeDate: { $gte: start, $lt: end },
    isActive: true,
  }).populate('topicId', 'title');

  if (!challenge) {
    return null;
  }

  const attempt = await DailyChallengeAttemptModel.findOne({
    citizenId: userId,
    challengeId: challenge._id,
  });

  return {
    id: challenge._id.toString(),
    title: (challenge.topicId as any)?.title
      ? `Daily Challenge: ${(challenge.topicId as any).title}`
      : 'Daily Legal Challenge',
    question: challenge.question,
    options: challenge.options,
    correct: challenge.correctIndex,
    xpReward: challenge.xpReward,
    completed: !!attempt,
  };
}

export async function getTrendingTopics(limit = 4) {
  const topics = await TopicModel.find({ status: 'published' })
    .sort({ watchCount: -1 })
    .limit(limit);

  if (!topics.length) return [];

  const maxWatch = Math.max(...topics.map((t) => t.watchCount || 0));

  return topics.map((t) => ({
    icon: 'Flame',
    title: t.title,
    reads: formatReads(t.watchCount || 0),
    hot: maxWatch > 0 && (t.watchCount || 0) >= maxWatch * 0.6,
    slug: t.slug,
  }));
}

export async function getBookmarks(userId: string, limit = 10) {
  const bookmarks = await BookmarkModel.find({ citizenId: userId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return bookmarks.map((b) => ({
    title: b.title,
    law: b.sourceName || '',
    color: b.accentColor || colorFromString(b.title),
  }));
}

export async function getCommunityHighlights(limit = 3) {
  const posts = await CommunityPostModel.find({ status: 'active' })
    .sort({ likes: -1, createdAt: -1 })
    .limit(limit);

  return posts.map((p: any) => ({
    initials: p.author?.name ? initialsFrom(p.author.name) : 'U',
    color: colorFromString(p.author?.name || p._id.toString()),
    name: p.author?.name || 'LawTicha member',
    text: p.content,
    time: timeAgo(p.createdAt),
    likes: p.likes || 0,
  }));
}

export async function getNextGoal(userId: string) {
  const goal = await GoalModel.findOne({ isActive: true }).sort({ sortOrder: 1 });
  if (!goal) return null;

  let progress = await CitizenGoalProgressModel.findOne({ citizenId: userId, goalId: goal._id });
  if (!progress) {
    progress = await CitizenGoalProgressModel.create({ citizenId: userId, goalId: goal._id, completedTaskIds: [] });
  }

  const doneIds = new Set(progress.completedTaskIds.map((id: Types.ObjectId) => id.toString()));
  const sortedTasks = [...goal.tasks].sort((a, b) => a.order - b.order);

  const tasks = sortedTasks.map((t) => ({
    done: doneIds.has(t._id.toString()),
    text: t.text,
  }));

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  return {
    title: goal.title,
    description: goal.description,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    total,
    completed,
    tasks,
  };
}

// Static — no video-hosting model exists yet; keep in one place so it's
// easy to swap for a real CMS-driven welcome video later.
export function getWelcomeVideo() {
  return {
    title: 'Welcome to LawTicha — get started in 3 minutes',
    duration: '3:12',
    views: 0,
    url: undefined as string | undefined,
  };
}

// ── Aggregate ────────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  await getOrCreateProfile(userId);

  const [stats, continueReading, dailyChallenge, trendingTopics, bookmarks, communityHighlights, nextGoal] =
    await Promise.all([
      getUserStats(userId),
      getContinueReading(userId, 4),
      getDailyChallenge(userId),
      getTrendingTopics(4),
      getBookmarks(userId, 6),
      getCommunityHighlights(3),
      getNextGoal(userId),
    ]);

  return {
    stats,
    continueReading,
    dailyChallenge,
    trendingTopics,
    bookmarks,
    communityHighlights,
    nextGoal,
    welcomeVideo: getWelcomeVideo(),
  };
}

// ── Mutations ────────────────────────────────────────────────────────────

export async function submitQuizAnswer(userId: string, questionId: string, answer: number) {
  if (!Types.ObjectId.isValid(questionId)) {
    throw new AppError('Invalid question id.', 400, 'VALIDATION_ERROR');
  }

  const challenge = await DailyChallengeModel.findById(questionId);
  if (!challenge || !challenge.isActive) {
    throw new AppError('This challenge is no longer available.', 404, 'NOT_FOUND');
  }

  const existing = await DailyChallengeAttemptModel.findOne({
    citizenId: userId,
    challengeId: challenge._id,
  });
  if (existing) {
    throw new AppError('You already answered today\u2019s challenge.', 409, 'ALREADY_ANSWERED');
  }

  const isCorrect = answer === challenge.correctIndex;
  const xpAwarded = isCorrect ? challenge.xpReward : 0;

  await DailyChallengeAttemptModel.create({
    citizenId: userId,
    challengeId: challenge._id,
    selectedIndex: answer,
    isCorrect,
    xpAwarded,
  });

  if (isCorrect && xpAwarded > 0) {
    await awardXP(userId, xpAwarded, 'daily_challenge');
  }

  return { correct: isCorrect, xpEarned: xpAwarded };
}

export async function updateReadingProgress(userId: string, slug: string, progress: number) {
  const clamped = Math.max(0, Math.min(100, progress));

  const module = await LegalModuleModel.findOne({ slug });
  if (!module) throw new AppError('Module not found.', 404, 'NOT_FOUND');

  const enrollment = await EnrollmentModel.findOneAndUpdate(
    { citizenId: userId, moduleId: module._id },
    {
      $set: {
        progressPercent: clamped,
        lastActivityAt: new Date(),
        ...(clamped >= 100 ? { status: 'complete', completedAt: new Date() } : {}),
      },
      $setOnInsert: { citizenId: userId, moduleId: module._id, status: clamped >= 100 ? 'complete' : 'active' },
    },
    { upsert: true, new: true }
  );

  const wasAlreadyComplete = clamped >= 100 && enrollment.xpEarned >= module.xpReward;
  if (clamped >= 100 && !wasAlreadyComplete) {
    const remainingXp = Math.max(module.xpReward - (enrollment.xpEarned || 0), 0);
    if (remainingXp > 0) {
      enrollment.xpEarned = (enrollment.xpEarned || 0) + remainingXp;
      await enrollment.save();
      await awardXP(userId, remainingXp, `module_complete:${module.slug}`);

      const profile = await CitizenProfileModel.findOne({ userId });
      await profile?.completeLesson();
    }
  }

  return { progress: clamped };
}

export async function addBookmark(userId: string, title: string, law: string) {
  const bookmark = await BookmarkModel.create({
    citizenId: userId,
    refType: 'legal_act',
    refId: new Types.ObjectId(), // no specific act reference from this lightweight endpoint
    title,
    sourceName: law,
    accentColor: colorFromString(title),
  });

  return { title: bookmark.title, law: bookmark.sourceName, color: bookmark.accentColor };
}

export async function removeBookmark(userId: string, title: string) {
  await BookmarkModel.deleteOne({ citizenId: userId, title });
}

export async function completeGoalTask(userId: string, taskText: string) {
  const goal = await GoalModel.findOne({ isActive: true }).sort({ sortOrder: 1 });
  if (!goal) throw new AppError('No active goal found.', 404, 'NOT_FOUND');

  const task = goal.tasks.find((t: any) => t.text === taskText);
  if (!task) throw new AppError('Task not found on the active goal.', 404, 'NOT_FOUND');

  let progress = await CitizenGoalProgressModel.findOne({ citizenId: userId, goalId: goal._id });
  if (!progress) {
    progress = await CitizenGoalProgressModel.create({ citizenId: userId, goalId: goal._id, completedTaskIds: [] });
  }

  const alreadyDone = progress.completedTaskIds.some((id: Types.ObjectId) => id.equals(task._id));
  if (alreadyDone) {
    return getNextGoal(userId);
  }

  progress.completedTaskIds.push(task._id);

  if (task.xpReward > 0) {
    await awardXP(userId, task.xpReward, `goal_task:${task._id.toString()}`);
  }

  const allDone = progress.completedTaskIds.length >= goal.tasks.length;
  if (allDone && !progress.bonusAwarded) {
    progress.bonusAwarded = true;
    progress.completedAt = new Date();
    if (goal.bonusXpOnCompletion > 0) {
      await awardXP(userId, goal.bonusXpOnCompletion, `goal_complete:${goal._id.toString()}`);
    }
  }

  await progress.save();

  return getNextGoal(userId);
}
