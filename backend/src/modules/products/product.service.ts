import { productRepository } from './product.repository';
import { ApiError } from '../../utils/ApiError';
import { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.validators';
import { invalidatePublicCache } from '../../utils/cache';

export const productService = {
  async list(query: ListProductsQuery) {
    return productRepository.findMany(query);
  },

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw ApiError.notFound('المنتج غير موجود أو غير متاح حالياً');
    return product;
  },

  async listCategories() {
    return productRepository.listCategories();
  },

  // ---- Admin ----

  async listAdmin(page: number, limit: number) {
    return productRepository.findManyAdmin(page, limit);
  },

  async getByIdAdmin(id: number) {
    const product = await productRepository.findByIdAdmin(id);
    if (!product) throw ApiError.notFound('المنتج غير موجود');
    return product;
  },

  async create(input: CreateProductInput) {
    // SKU uniqueness is enforced at DB level too; this gives a clearer error early.
    const skus = input.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      throw ApiError.badRequest('يوجد تكرار في رموز SKU ضمن نفس المنتج');
    }

    if (input.discountPrice !== undefined && input.discountPrice >= input.basePrice) {
      throw ApiError.badRequest('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
    }

    // Name is optional in the admin form — fall back to a sensible default
    // derived from the category so every product still has a display name.
    const nameAr = input.nameAr?.trim() || `${input.category} — بدون اسم`;

    return productRepository.create({
      slug: input.slug,
      nameAr,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr,
      category: input.category,
      basePrice: input.basePrice,
      discountPrice: input.discountPrice,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      variants: { create: input.variants },
    }).then((product) => {
      invalidatePublicCache();
      return product;
    });
  },

  async update(id: number, input: UpdateProductInput) {
    const existing = await this.getByIdAdmin(id);

    const { variants, ...rest } = input;

    if (variants) {
      const skus = variants.map((v) => v.sku);
      if (new Set(skus).size !== skus.length) {
        throw ApiError.badRequest('يوجد تكرار في رموز SKU ضمن نفس المنتج');
      }
      await productRepository.replaceVariants(id, variants);
    }

    if (rest.discountPrice) {
      const effectiveBasePrice = rest.basePrice ?? Number(existing.basePrice);
      if (rest.discountPrice >= effectiveBasePrice) {
        throw ApiError.badRequest('سعر الخصم يجب أن يكون أقل من السعر الأساسي');
      }
    }

    const updated = await productRepository.update(id, rest);
    invalidatePublicCache();
    return updated;
  },

  async remove(id: number) {
    await this.getByIdAdmin(id);
    const result = await productRepository.delete(id);
    invalidatePublicCache();
    return result;
  },

  async addImage(
    productId: number,
    payload: { imageUrl: string; altText?: string; isPrimary?: boolean; sortOrder?: number }
  ) {
    await this.getByIdAdmin(productId);
    const image = await productRepository.addImage(productId, payload);
    invalidatePublicCache();
    return image;
  },

  async deleteImage(imageId: number) {
    const result = await productRepository.deleteImage(imageId);
    invalidatePublicCache();
    return result;
  },
};
