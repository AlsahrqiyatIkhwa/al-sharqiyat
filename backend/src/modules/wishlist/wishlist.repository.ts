import { prisma } from '../../config/db';

const productSummaryInclude = {
  product: {
    include: { images: true, variants: true },
  },
};

export const wishlistRepository = {
  async listByDevice(deviceId: string) {
    return prisma.wishlistItem.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      include: productSummaryInclude,
    });
  },

  async add(deviceId: string, productId: number) {
    // Idempotent — re-adding an already-wishlisted product is a no-op, not an error
    return prisma.wishlistItem.upsert({
      where: { deviceId_productId: { deviceId, productId } },
      update: {},
      create: { deviceId, productId },
    });
  },

  async remove(deviceId: string, productId: number) {
    await prisma.wishlistItem.deleteMany({ where: { deviceId, productId } });
  },
};
