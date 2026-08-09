import { z } from 'zod';
import { Governorate } from '@prisma/client';

// 07xxxxxxxx — Jordanian mobile format (10 digits total, starts with 07)
const JORDAN_PHONE_REGEX = /^07[789]\d{7}$/;

// z.nativeEnum binds directly to the Prisma Governorate enum, so the
// validator and the database schema can never drift out of sync.
const governorateEnum = z.nativeEnum(Governorate, {
  errorMap: () => ({ message: 'يرجى اختيار محافظة أردنية صحيحة من القائمة' }),
});

export const orderItemInputSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});

const ORDER_STATUS_VALUES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

// Cash-on-delivery (COD) requires no upfront deposit — the full amount is
// paid in cash on delivery. Paying the full amount via Orange Money
// (paymentMethod ORANGE_MONEY) requires the Orange Money phone/reference
// fields — the whole total is transferred upfront and an admin manually
// confirms the order. MANUAL_TRANSFER keeps the existing
// full-payment-by-transfer flow and has no Orange Money fields.
const TRANSFER_FIELDS_REQUIRED_METHODS = new Set(['ORANGE_MONEY']);

export const createOrderSchema = z
  .object({
    firstName: z.string().trim().min(2, 'الاسم الأول مطلوب').max(60),
    lastName: z.string().trim().min(2, 'اسم العائلة مطلوب').max(60),
    customerPhone: z
      .string()
      .trim()
      .regex(JORDAN_PHONE_REGEX, 'رقم هاتف أردني غير صحيح (مثال: 0791234567)'),
    governorate: governorateEnum,
    area: z.string().trim().min(2, 'يرجى إدخال الحي / المنطقة').max(120),
    street: z.string().trim().min(2, 'يرجى إدخال اسم الشارع').max(160),
    buildingNumber: z.string().trim().min(1, 'يرجى إدخال رقم المبنى/الشقة').max(60),
    landmark: z.string().trim().max(200).optional().or(z.literal('')),
    items: z.array(orderItemInputSchema).min(1, 'السلة فارغة'),
    paymentMethod: z.enum(['COD', 'MANUAL_TRANSFER', 'ORANGE_MONEY']).default('COD'),
    // Deposit / Orange Money transfer info — required for COD and
    // ORANGE_MONEY (see superRefine below)
    depositTransactionRef: z.string().trim().max(100).optional().or(z.literal('')),
    depositPhoneNumber: z
      .string()
      .trim()
      .regex(JORDAN_PHONE_REGEX, 'رقم هاتف أورنج موني غير صحيح (مثال: 0791234567)')
      .optional()
      .or(z.literal('')),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!TRANSFER_FIELDS_REQUIRED_METHODS.has(data.paymentMethod)) return;

    if (!data.depositTransactionRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['depositTransactionRef'],
        message: 'يرجى إدخال رقم مرجع تحويل أورنج موني',
      });
    }
    if (!data.depositPhoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['depositPhoneNumber'],
        message: 'يرجى إدخال رقم هاتف أورنج موني الذي تم الدفع منه',
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  note: z.string().trim().max(300).optional(),
});

export const verifyDepositSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  paymentStatus: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID', 'FAILED']).optional(),
  governorate: governorateEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export const orderCodeParamSchema = z.object({
  orderCode: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
