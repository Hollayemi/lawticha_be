import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError, AppResponse } from '../middleware/error';

import SpecialismModel from '../models/Specialism.model';

export const listAllSpeicalism = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const specialisms = await SpecialismModel.find()

    return (res as AppResponse).data(specialisms, "Modules fetched successfully.");
  })