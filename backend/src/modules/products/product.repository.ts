import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ListProductsQuery } from './product.validators';

const publicProductInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: true,
};

export const productRepository = {
  async findMany(query: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.featured ? { isFeatured: true } : {}),
      ...(query.search
        ? {
            OR: [
              { nameAr: { contains: query.search, mode: 'insensitive' } },
              { nameEn: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : query.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        include: publicProductInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  },

  async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, isActive: true },
      include: publicProductInclude,
    });
  },

  // ---- Admin (includes inactive products) ----

  async findByIdAdmin(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: publicProductInclude,
    });
  },

  async findManyAdmin(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        include: publicProductInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count(),
    ]);
    return { items, total, page, limit };
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: publicProductInclude });
  },

  async update(id: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: publicProductInclude });
  },

  async delete(id: number) {
    // Soft-delete pattern preferred for e-commerce audit trail,
    // but hard-delete is exposed here for full CRUD as requested.
    return prisma.product.delete({ where: { id } });
  },

  async replaceVariants(
    productId: number,
    variants: Omit<Prisma.ProductVariantCreateManyInput, 'productId'>[]
  ) {
    return prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.productVariant.createMany({
        data: variants.map((v) => ({ ...v, productId })),
      }),
    ]);
  },

  async addImage(productId: number, data: { imageUrl: string; altText?: string; isPrimary?: boolean; sortOrder?: number }) {
    return prisma.productImage.create({ data: { ...data, productId } });
  },

  async deleteImage(imageId: number) {
    return prisma.productImage.delete({ where: { id: imageId } });
  },

  async listCategories() {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return rows.map((r) => r.category);
  },
};
