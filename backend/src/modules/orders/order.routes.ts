import { Router } from 'express';
import { orderController } from './order.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderSchema, orderCodeParamSchema } from './order.validators';
import {
  orderCreationRateLimiter,
  orderTrackingRateLimiter,
} from '../../middlewares/rateLimit.middleware';

const router = Router();

router.post(
  '/',
  orderCreationRateLimiter,
  validate({ body: createOrderSchema }),
  orderController.create
);
router.get(
  '/:orderCode',
  orderTrackingRateLimiter,
  validate({ params: orderCodeParamSchema }),
  orderController.getByCode
);

export default router;
