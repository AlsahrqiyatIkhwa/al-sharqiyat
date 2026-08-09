import { reviewRepository } from './review.repository';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../utils/logger';
import { CreateReviewInput, ListReviewsQuery } from './review.validators';

export const reviewService = {
  async create(input: CreateReviewInput) {
    const order = await reviewRepository.findEligibleOrder(
      input.orderCode,
      input.customerPhone,
      input.productId
    );

    if (!order) {
      throw ApiError.badRequest(
        'لا يمكن إضافة تقييم — تعذر العثور على طلب بهذا الرقم وهذا الهاتف يحتوي على هذا المنتج'
      );
    }

    const existing = await reviewRepository.findExistingReview(order.id, input.productId);
    if (existing) {
      throw ApiError.conflict('لقد قمتِ بتقييم هذا المنتج مسبقاً لهذا الطلب');
    }

    const review = await reviewRepository.create(
      input,
      order.id,
      `${order.firstName} ${order.lastName.charAt(0)}.` // e.g. "سارة أ." — first name + last initial for privacy
    );

    logger.info('Review submitted', { productId: input.productId, orderId: order.id, rating: input.rating });

    return review;
  },

  async listByProduct(query: ListReviewsQuery) {
    return reviewRepository.listByProduct(query);
  },
};
