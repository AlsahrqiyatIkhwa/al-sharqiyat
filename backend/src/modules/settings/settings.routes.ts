import { Router, Request, Response } from 'express';
import { env } from '../../config/env';

const router = Router();

/**
 * GET /api/settings/payment-instructions
 *
 * Public, read-only endpoint. Returns ONLY display strings for the
 * supported payment methods (Cash on Delivery with no deposit, Orange
 * Money in full, Western Union / bank transfer). There is no payment
 * gateway, no card data, and no transaction processing involved — Orange
 * Money / manual transfers are verified manually by an admin — this is
 * business contact info only.
 */
router.get('/payment-instructions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    methods: {
      COD: {
        label: 'الدفع عند الاستلام',
        description: 'ادفعي المبلغ بالكامل نقداً عند استلام طلبك من مندوب التوصيل.',
      },
      ORANGE_MONEY: {
        label: 'أورنج موني',
        merchantNumber: env.orangeMoney.merchantNumber,
        merchantName: env.orangeMoney.merchantName,
        instructions:
          'حوّلي القيمة الكاملة للطلب إلى رقم أورنج موني أعلاه، ثم أدخلي رقم الهاتف ورقم مرجع العملية عند إتمام الطلب.',
      },
      MANUAL_TRANSFER: {
        label: 'تحويل يدوي (ويسترن يونيون / تحويل بنكي)',
        receiverName: env.manualPayment.receiverName,
        country: env.manualPayment.country,
        instructions: env.manualPayment.instructions,
        bankTransferDetails: env.manualPayment.bankTransferDetails || null,
      },
    },
  });
});

export default router;
