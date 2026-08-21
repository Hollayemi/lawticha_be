import { Request, Response, NextFunction } from 'express';
export declare const listLearnModules: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getFullMaterial: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const generateMaterialSummary: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getLearnModuleBySlug: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getLearnTopicBySlug: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getContinueReading: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const getFeaturedTopics: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const toggleSaveModule: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const enrolInModule: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const markTopicComplete: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const saveVideoProgress: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /learn/subtopics/:subtopicId/bookmarks
 * Create a new bookmark for a subtopic
 */
export declare const createBookmark: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /learn/subtopics/:subtopicId/bookmarks
 * Get all bookmarks for a subtopic
 */
export declare const listBookmarksForSubtopic: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /learn/bookmarks
 * Get all bookmarks for the authenticated user with pagination
 */
export declare const listMyBookmarks: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /learn/bookmarks/:bookmarkId
 * Get a single bookmark by ID
 */
export declare const getBookmarkById: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * PUT /learn/bookmarks/:bookmarkId
 * Update a bookmark
 */
export declare const updateBookmark: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * DELETE /learn/bookmarks/:bookmarkId
 * Delete a bookmark
 */
export declare const deleteBookmark: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /learn/subtopics/:subtopicId/like
 * Toggle like on a subtopic
 */
export declare const toggleLikeSubtopic: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * POST /learn/subtopics/:subtopicId/complete
 * Toggle complete status on a subtopic
 */
export declare const toggleCompleteSubtopic: (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * GET /learn/subtopics/:subtopicId/state
 * Get the current user's state for a subtopic (liked, completed)
 */
export declare const getSubtopicState: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=learn.controller.d.ts.map