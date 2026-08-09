import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../config/db';
import { cacheResponse } from '../../utils/cache';

const router = Router();

// GET /api/shipping-zones — used by checkout form to populate governorate dropdown + fee
router.get(
  '/',
  cacheResponse(300),
  asyncHandler(async (_req, res) => {
    const zones = await prisma.shippingZone.findMany({
      orderBy: { governorate: 'asc' },
    });
    res.json({ success: true, zones });
  })
);

export default router;
