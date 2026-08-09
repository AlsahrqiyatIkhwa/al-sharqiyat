import { Router } from 'express';
import { productController } from './product.controller';
import { validate } from '../../middlewares/validate.middleware';
import { listProductsQuerySchema, slugParamSchema } from './product.validators';
import { cacheResponse } from '../../utils/cache';

const router = Router();

router.get('/', validate({ query: listProductsQuerySchema }), cacheResponse(60), productController.list);
router.get('/categories', cacheResponse(300), productController.categories);
router.get('/:slug', validate({ params: slugParamSchema }), cacheResponse(60), productController.getBySlug);

export default router;
