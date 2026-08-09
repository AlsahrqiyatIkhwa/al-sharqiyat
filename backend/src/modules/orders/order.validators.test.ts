import { describe, it, expect } from 'vitest';
import { Governorate } from '@prisma/client';
import { createOrderSchema } from './order.validators';

const baseInput = {
  firstName: 'سارة',
  lastName: 'الخطيب',
  customerPhone: '0791234567',
  governorate: Governorate.AMMAN,
  area: 'الصويفية',
  street: 'شارع الوكالات',
  buildingNumber: '12',
  items: [{ variantId: 1, quantity: 2 }],
};

describe('createOrderSchema — payment method / deposit rules', () => {
  it('does not require deposit fields for COD (no upfront deposit)', () => {
    const result = createOrderSchema.safeParse({ ...baseInput, paymentMethod: 'COD' });
    expect(result.success).toBe(true);
  });

  it('rejects a full ORANGE_MONEY payment missing the transfer reference', () => {
    const result = createOrderSchema.safeParse({ ...baseInput, paymentMethod: 'ORANGE_MONEY' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('depositTransactionRef');
      expect(paths).toContain('depositPhoneNumber');
    }
  });

  it('accepts a full ORANGE_MONEY payment that includes both transfer fields', () => {
    const result = createOrderSchema.safeParse({
      ...baseInput,
      paymentMethod: 'ORANGE_MONEY',
      depositTransactionRef: 'OM-TX-998877',
      depositPhoneNumber: '0781234567',
    });
    expect(result.success).toBe(true);
  });

  it('does not require deposit fields for MANUAL_TRANSFER', () => {
    const result = createOrderSchema.safeParse({ ...baseInput, paymentMethod: 'MANUAL_TRANSFER' });
    expect(result.success).toBe(true);
  });

  it('defaults paymentMethod to COD when omitted, with no deposit fields required', () => {
    const { paymentMethod, ...withoutMethod } = { ...baseInput, paymentMethod: 'COD' as const };
    const result = createOrderSchema.safeParse(withoutMethod);
    expect(result.success).toBe(true);
  });
});

describe('createOrderSchema — field validation', () => {
  it('rejects a non-Jordanian phone number format', () => {
    const result = createOrderSchema.safeParse({
      ...baseInput,
      paymentMethod: 'MANUAL_TRANSFER',
      customerPhone: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty cart', () => {
    const result = createOrderSchema.safeParse({
      ...baseInput,
      paymentMethod: 'MANUAL_TRANSFER',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a line quantity above the 20-unit cap', () => {
    const result = createOrderSchema.safeParse({
      ...baseInput,
      paymentMethod: 'MANUAL_TRANSFER',
      items: [{ variantId: 1, quantity: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid governorate value', () => {
    const result = createOrderSchema.safeParse({
      ...baseInput,
      paymentMethod: 'MANUAL_TRANSFER',
      governorate: 'NOT_A_REAL_PLACE',
    });
    expect(result.success).toBe(false);
  });
});
