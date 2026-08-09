import { Router, Request, Response } from 'express';
import { prisma } from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAdminAuth } from '../../middlewares/auth.middleware';

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/stats — dashboard summary cards
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalProducts,
      revenueAgg,
      lowStockVariants,
      recentOrders,
    ] = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.productVariant.count({ where: { stockQuantity: { lte: 3 } } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderCode: true,
          firstName: true,
          lastName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        totalRevenue: revenueAgg._sum.total ?? 0,
        lowStockVariants,
      },
      recentOrders,
    });
  })
);

export default router;
