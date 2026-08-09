import { describe, it, expect } from 'vitest';
import { generateNextOrderCode } from './orderCode.util';

/** Minimal stand-in for Prisma.TransactionClient — only orderCounter.upsert is used. */
function makeMockTx(startingNumber = 1) {
  let lastNumber = startingNumber - 1;
  return {
    orderCounter: {
      upsert: async () => {
        lastNumber += 1;
        return { yearMonth: '000000', lastNumber };
      },
    },
  } as any;
}

describe('generateNextOrderCode', () => {
  it('matches the SHRQ-YYYYMM-XXXX-RRRRR format', async () => {
    const code = await generateNextOrderCode(makeMockTx());
    expect(code).toMatch(/^SHRQ-\d{6}-\d{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
  });

  it('zero-pads the sequence number to 4 digits', async () => {
    const code = await generateNextOrderCode(makeMockTx(7));
    const sequence = code.split('-')[2];
    expect(sequence).toBe('0007');
  });

  it('never includes visually ambiguous characters (0, O, 1, I, L) in the random suffix', async () => {
    const codes = await Promise.all(Array.from({ length: 30 }, () => generateNextOrderCode(makeMockTx())));
    const suffixes = codes.map((c) => c.split('-')[3]);
    for (const suffix of suffixes) {
      expect(suffix).not.toMatch(/[0O1IL]/);
    }
  });

  it('produces a different random suffix across calls (collision-resistant)', async () => {
    const codes = await Promise.all(Array.from({ length: 20 }, () => generateNextOrderCode(makeMockTx())));
    const suffixes = codes.map((c) => c.split('-')[3]);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });
});
