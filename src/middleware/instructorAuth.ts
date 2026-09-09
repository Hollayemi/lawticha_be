import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from './error';
import { LawyerProfileModel, ILawyerProfileDocument } from '../models/LawyerProfile.model';
import { InstructorStatus } from '../models/types/lawticha.types';

//  Extend Express Request 

declare global {
  namespace Express {
    interface Request {
      instructorProfile?: ILawyerProfileDocument;
    }
  }
}

// requireInstructor 
//
// Must run AFTER `protect` (needs req.user). Loads the caller's LawyerProfile,
// confirms instructorStatus === 'approved', and attaches it as req.instructorProfile
// so downstream handlers can scope queries to this instructor's own content.

export const requireInstructor = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in. Please sign in to continue.', 401, 'UNAUTHORIZED'));
    }

    const profile = await LawyerProfileModel.findOne({ userId: req.user._id });

    if (!profile) {
      return next(new AppError('Lawyer profile not found.', 404, 'NOT_FOUND'));
    }

    if (profile.instructorStatus !== InstructorStatus.APPROVED) {
      return next(
        new AppError(
          'You must be an approved instructor to access this resource.',
          403,
          'FORBIDDEN'
        )
      );
    }

    req.instructorProfile = profile;
    next();
  }
);
