import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reviewService } from './review.service';

export const reviewController = {
  // POST /api/reviews
  create: asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.create(req.body);
    res.status(201).json({ success: true, review });
  }),

  // GET /api/reviews?productId=123&page=1&limit=10
  listByProduct: asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.listByProduct(req.query as any);
    res.json({ success: true, ...result });
  }),
};
