import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { auditService } from './audit.service';

const router = Router();

router.use(requireAdminAuth);

// GET /api/admin/audit-logs?entityType=Product&entityId=12
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.query as { entityType?: string; entityId?: string };
    const logs =
      entityType && entityId
        ? await auditService.listForEntity(entityType, entityId)
        : await auditService.listRecent(200);
    res.json({ success: true, logs });
  })
);

export default router;
