import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { CreateReviewInput, ListReviewsQuery } from './review.validators';

export const reviewRepository = {
  /**
   * Finds an order that matches the given tracking code + phone number and
   * actually contains the product being reviewed. This is the "did this
   * person really buy it" check — there's no customer account/userId in
   * this storefront, so the purchase record itself is the identity proof.
   */
  async findEligibleOrder(orderCode: string, customerPhone: string, productId: number) {
    return prisma.order.findFirst({
      where: {
        orderCode,
        customerPhone,
        status: { not: 'CANCELLED' },
        items: { some: { variant: { productId } } },
      },
      select: { id: true, firstName: true, lastName: true },
    });
  },

  async findExistingReview(orderId: number, productId: number) {
    return prisma.review.findUnique({
      where: { orderId_productId: { orderId, productId } },
    });
  },

  async create(input: CreateReviewInput, orderId: number, customerName: string) {
    return prisma.review.create({
      data: {
        productId: input.productId,
        orderId,
        customerName,
        customerPhone: input.customerPhone,
        rating: input.rating,
        comment: input.comment || null,
      },
    });
  },

  async listByProduct(query: ListReviewsQuery) {
    const where: Prisma.ReviewWhereInput = { productId: query.productId };

    const [items, total, aggregate] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true }, _count: true }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
      reviewCount: aggregate._count,
    };
  },

  /** Used by the product detail endpoint to show the rating summary without paginated reviews. */
  async getSummary(productId: number) {
    const aggregate = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    return {
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
      reviewCount: aggregate._count,
    };
  },
};
