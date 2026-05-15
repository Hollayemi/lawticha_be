import { Request, Response, NextFunction } from 'express';
import * as learnService from '../services/learn.service';

import { AppError, AppResponse } from '../middleware/error';
import { Types } from 'mongoose';

// GET /learn/modules
export async function listLearnModules(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      tab,
      search,
      category,
      page = 1,
      pageSize = 20,
    } = req.query;

    const citizenId = (req as any).user?.id;

    const result = await learnService.listLearnModules({
      tab: tab as any,
      search: search as string,
      category: category as any,
      page: Number(page),
      pageSize: Number(pageSize),
      citizenId,
    });

    return (res as AppResponse).data({
      data: result.data,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    }, "Modules retrieved successfully.");

  } catch (error) {
    next(error);
  }
}

// GET /learn/modules/:slug
export async function getLearnModuleBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const citizenId = (req as any).user?.id;

    const moduleDetail = await learnService.getLearnModuleBySlug(slug, citizenId);

    res.status(200).json({
      success: true,
      message: 'Module retrieved successfully',
      data: moduleDetail,
    });
  } catch (error) {
    next(error);
  }
}

// GET /learn/modules/:moduleSlug/topics/:topicSlug
export async function getLearnTopicBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleSlug, topicSlug } = req.params;
    const citizenId = (req as any).user?.id;

    const topicDetail = await learnService.getLearnTopicBySlug(moduleSlug, topicSlug, citizenId);

    res.status(200).json({
      success: true,
      message: 'Topic retrieved successfully',
      data: topicDetail,
    });
  } catch (error) {
    next(error);
  }
}

// GET /learn/continue-reading
export async function getContinueReading(req: Request, res: Response, next: NextFunction) {
  try {
    const citizenId = (req as any).user?.id;

    if (!citizenId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const continueReading = await learnService.getContinueReading(citizenId);

    res.status(200).json({
      success: true,
      message: 'Continue reading items retrieved successfully',
      data: continueReading,
    });
  } catch (error) {
    next(error);
  }
}

// GET /learn/featured-topics
export async function getFeaturedTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const featuredTopics = await learnService.getFeaturedTopics();

    res.status(200).json({
      success: true,
      message: 'Featured topics retrieved successfully',
      data: featuredTopics,
    });
  } catch (error) {
    next(error);
  }
}

// POST /learn/modules/:moduleId/save
export async function toggleSaveModule(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId } = req.params;
    const citizenId = (req as any).user?.id;

    if (!citizenId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const result = await learnService.toggleSaveModule(moduleId, citizenId);

    res.status(200).json({
      success: true,
      message: result.saved ? 'Module saved successfully' : 'Module unsaved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// POST /learn/modules/:moduleId/enrol
export async function enrolInModule(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId } = req.params;
    const citizenId = (req as any).user?.id;

    if (!citizenId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const result = await learnService.enrolInModule(moduleId, citizenId);

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in module',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// POST /learn/modules/:moduleId/topics/:topicId/complete
export async function markTopicComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, topicId } = req.params;
    const citizenId = (req as any).user?.id;

    if (!citizenId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const result = await learnService.markTopicComplete(moduleId, topicId, citizenId);

    res.status(200).json({
      success: true,
      message: 'Topic marked as complete',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /learn/modules/:moduleId/topics/:topicId/progress
export async function saveVideoProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, topicId } = req.params;
    const { currentTimeSeconds } = req.body;
    const citizenId = (req as any).user?.id;

    if (!citizenId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (typeof currentTimeSeconds !== 'number') {
      throw new AppError('currentTimeSeconds is required and must be a number', 400, 'INVALID_INPUT');
    }

    const result = await learnService.saveVideoProgress(moduleId, topicId, citizenId, currentTimeSeconds);

    res.status(200).json({
      success: true,
      message: 'Video progress saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
