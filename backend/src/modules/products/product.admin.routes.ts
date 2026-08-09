import { Router } from 'express';
import { productController } from './product.controller';
import { requireAdminAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadProductImage } from '../../middlewares/upload.middleware';
import { createProductSchema, idParamSchema, updateProductSchema } from './product.validators';

const router = Router();

router.use(requireAdminAuth);

router.get('/', productController.listAdmin);
router.get('/:id', validate({ params: idParamSchema }), productController.getByIdAdmin);
router.post('/', validate({ body: createProductSchema }), productController.create);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update
);
router.delete('/:id', validate({ params: idParamSchema }), productController.remove);

router.post('/:id/images', uploadProductImage.single('image'), productController.uploadImage);
router.delete('/images/:imageId', productController.deleteImage);

export default router;
