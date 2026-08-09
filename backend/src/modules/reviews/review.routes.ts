import { Router } from 'express';
import { reviewController } from './review.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createReviewSchema, listReviewsQuerySchema } from './review.validators';
import { reviewCreationRateLimiter } from '../../middlewares/rateLimit.middleware';

const router = Router();

router.get('/', validate({ query: listReviewsQuerySchema }), reviewController.listByProduct);
router.post(
  '/',
  reviewCreationRateLimiter,
  validate({ body: createReviewSchema }),
  reviewController.create
);

export default router;
