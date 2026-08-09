import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  addWishlistSchema,
  listWishlistQuerySchema,
  removeWishlistParamsSchema,
  removeWishlistQuerySchema,
} from './wishlist.validators';
import { wishlistRateLimiter } from '../../middlewares/rateLimit.middleware';

const router = Router();

router.use(wishlistRateLimiter);

router.get('/', validate({ query: listWishlistQuerySchema }), wishlistController.list);
router.post('/', validate({ body: addWishlistSchema }), wishlistController.add);
router.delete(
  '/:productId',
  validate({ params: removeWishlistParamsSchema, query: removeWishlistQuerySchema }),
  wishlistController.remove
);

export default router;
