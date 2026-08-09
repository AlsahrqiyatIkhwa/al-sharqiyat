import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { orderService } from './order.service';
import { auditService } from '../audit/audit.service';

export const orderController = {
  // POST /api/orders
  create: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.create(req.body);
    res.status(201).json({ success: true, order });
  }),

  // GET /api/orders/:orderCode
  getByCode: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getByCode(req.params.orderCode);
    res.json({ success: true, order });
  }),

  // ---- Admin ----

  // GET /api/admin/orders
  listAdmin: asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.listAdmin(req.query as any);
    res.json({ success: true, ...result });
  }),

  // GET /api/admin/orders/:id
  getByIdAdmin: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getByIdAdmin(Number(req.params.id));
    res.json({ success: true, order });
  }),

  // PATCH /api/admin/orders/:id/status
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const order = await orderService.updateStatus(id, req.body.status);
    await auditService.log({
      adminId: req.admin?.adminId,
      action: 'ORDER_STATUS_UPDATE',
      entityType: 'Order',
      entityId: id,
      meta: { newStatus: req.body.status, note: req.body.note },
      req,
    });
    res.json({ success: true, order });
  }),

  // PATCH /api/admin/orders/:id/verify-deposit
  verifyDeposit: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const order = await orderService.verifyDeposit(id, req.admin?.adminId);
    await auditService.log({
      adminId: req.admin?.adminId,
      action: 'ORDER_DEPOSIT_VERIFIED',
      entityType: 'Order',
      entityId: id,
      meta: { note: req.body.note },
      req,
    });
    res.json({ success: true, order });
  }),
};
