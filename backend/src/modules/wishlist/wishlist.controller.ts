import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { wishlistRepository } from './wishlist.repository';
import { logger } from '../../utils/logger';

export const wishlistController = {
  // GET /api/wishlist?deviceId=...
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await wishlistRepository.listByDevice((req.query as any).deviceId);
    res.json({ success: true, items });
  }),

  // POST /api/wishlist  { deviceId, productId }
  add: asyncHandler(async (req: Request, res: Response) => {
    const { deviceId, productId } = req.body;
    const item = await wishlistRepository.add(deviceId, productId);
    logger.info('Wishlist item added', { productId });
    res.status(201).json({ success: true, item });
  }),

  // DELETE /api/wishlist/:productId?deviceId=...
  remove: asyncHandler(async (req: Request, res: Response) => {
    const productId = Number(req.params.productId);
    const deviceId = (req.query as any).deviceId;
    await wishlistRepository.remove(deviceId, productId);
    res.json({ success: true });
  }),
};
