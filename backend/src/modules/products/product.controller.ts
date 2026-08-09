import { Request, Response } from 'express';
import path from 'path';
import { asyncHandler } from '../../utils/asyncHandler';
import { productService } from './product.service';
import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/audit.service';

export const productController = {
  // GET /api/products
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.list(req.query as any);
    res.json({ success: true, ...result });
  }),

  // GET /api/products/categories
  categories: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await productService.listCategories();
    res.json({ success: true, categories });
  }),

  // GET /api/products/:slug
  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getBySlug(req.params.slug);
    res.json({ success: true, product });
  }),

  // ---- Admin ----

  // GET /api/admin/products
  listAdmin: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await productService.listAdmin(page, limit);
    res.json({ success: true, ...result });
  }),

  // GET /api/admin/products/:id
  getByIdAdmin: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getByIdAdmin(Number(req.params.id));
    res.json({ success: true, product });
  }),

  // POST /api/admin/products
  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    await auditService.log({
      adminId: req.admin?.adminId,
      action: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product.id,
      meta: { slug: product.slug },
      req,
    });
    res.status(201).json({ success: true, product });
  }),

  // PUT /api/admin/products/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(Number(req.params.id), req.body);
    await auditService.log({
      adminId: req.admin?.adminId,
      action: 'PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: product.id,
      meta: { fields: Object.keys(req.body) },
      req,
    });
    res.json({ success: true, product });
  }),

  // DELETE /api/admin/products/:id
  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await productService.remove(id);
    await auditService.log({ adminId: req.admin?.adminId, action: 'PRODUCT_DELETE', entityType: 'Product', entityId: id, req });
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  }),

  // POST /api/admin/products/:id/images  (multipart/form-data, field name: "image")
  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('لم يتم إرفاق صورة');

    const productId = Number(req.params.id);
    // req.fileUrl is set only when STORAGE_DRIVER=s3 (full public URL);
    // otherwise fall back to the existing local-disk relative URL, unchanged.
    const imageUrl = req.fileUrl || `/uploads/${path.basename(req.file.path)}`;

    const image = await productService.addImage(productId, {
      imageUrl,
      isPrimary: req.body.isPrimary === 'true',
      sortOrder: Number(req.body.sortOrder) || 0,
    });

    await auditService.log({
      adminId: req.admin?.adminId,
      action: 'PRODUCT_IMAGE_UPLOAD',
      entityType: 'Product',
      entityId: productId,
      meta: { imageUrl },
      req,
    });

    res.status(201).json({ success: true, image });
  }),

  // DELETE /api/admin/products/images/:imageId
  deleteImage: asyncHandler(async (req: Request, res: Response) => {
    const imageId = Number(req.params.imageId);
    await productService.deleteImage(imageId);
    await auditService.log({ adminId: req.admin?.adminId, action: 'PRODUCT_IMAGE_DELETE', entityType: 'ProductImage', entityId: imageId, req });
    res.json({ success: true, message: 'تم حذف الصورة' });
  }),
};
