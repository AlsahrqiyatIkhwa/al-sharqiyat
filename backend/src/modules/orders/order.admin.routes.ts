import { Router } from 'express';
import { orderController } from './order.controller';
import { requireAdminAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  idParamSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  verifyDepositSchema,
} from './order.validators';

const router = Router();

router.use(requireAdminAuth);

router.get('/', validate({ query: listOrdersQuerySchema }), orderController.listAdmin);
router.get('/:id', validate({ params: idParamSchema }), orderController.getByIdAdmin);
router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus
);
router.patch(
  '/:id/verify-deposit',
  validate({ params: idParamSchema, body: verifyDepositSchema }),
  orderController.verifyDeposit
);

export default router;
