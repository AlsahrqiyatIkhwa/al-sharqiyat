import { z } from 'zod';
import { GOVERNORATES } from './governorates';

const GOVERNORATE_VALUES = GOVERNORATES.map((g) => g.value) as [string, ...string[]];

const JORDAN_PHONE_REGEX = /^07[789]\d{7}$/;
// COD ("pay on delivery") requires no upfront deposit — the full amount is
// paid in cash on delivery. ORANGE_MONEY means the customer pays the FULL
// amount via Orange Money and requires the Orange Money phone/reference
// fields. See order.validators.ts on the backend for the source of truth.
const TRANSFER_FIELDS_REQUIRED_METHODS = new Set(['ORANGE_MONEY']);

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(2, 'الاسم الأول مطلوب').max(60, 'الاسم طويل جداً'),
    lastName: z.string().trim().min(2, 'اسم العائلة مطلوب').max(60, 'الاسم طويل جداً'),
    customerPhone: z.string().trim().regex(JORDAN_PHONE_REGEX, 'رقم هاتف أردني غير صحيح، مثال: 0791234567'),
    governorate: z.enum(GOVERNORATE_VALUES, {
      errorMap: () => ({ message: 'يرجى اختيار المحافظة' }),
    }),
    area: z.string().trim().min(2, 'يرجى إدخال الحي / المنطقة').max(120, 'طويل جداً'),
    street: z.string().trim().min(2, 'يرجى إدخال اسم الشارع').max(160, 'طويل جداً'),
    buildingNumber: z.string().trim().min(1, 'يرجى إدخال رقم المبنى/الشقة').max(60, 'طويل جداً'),
    landmark: z.string().trim().max(200, 'طويل جداً').optional().or(z.literal('')),
    paymentMethod: z.enum(['COD', 'MANUAL_TRANSFER', 'ORANGE_MONEY'], {
      required_error: 'يرجى اختيار طريقة الدفع',
    }),
    // Required only when paymentMethod is ORANGE_MONEY (full payment)
    depositTransactionRef: z.string().trim().max(100).optional().or(z.literal('')),
    depositPhoneNumber: z
      .string()
      .trim()
      .regex(JORDAN_PHONE_REGEX, 'رقم هاتف أورنج موني غير صحيح، مثال: 0791234567')
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

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
