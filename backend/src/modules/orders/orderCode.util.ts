import crypto from 'crypto';
import { Prisma } from '@prisma/client';

// Characters chosen to avoid visual ambiguity (no 0/O, 1/I/L) when a
// customer reads the code aloud or copies it from a WhatsApp message.
const RANDOM_SUFFIX_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const RANDOM_SUFFIX_LENGTH = 5;

function randomSuffix(): string {
  const bytes = crypto.randomBytes(RANDOM_SUFFIX_LENGTH);
  let out = '';
  for (let i = 0; i < RANDOM_SUFFIX_LENGTH; i++) {
    out += RANDOM_SUFFIX_ALPHABET[bytes[i] % RANDOM_SUFFIX_ALPHABET.length];
  }
  return out;
}

/**
 * Generates the next tracking code in the format `SHRQ-YYYYMM-XXXX-RRRRR`
 * (e.g. `SHRQ-202607-0001-7K9QX`).
 *
 * - `YYYYMM` groups codes by calendar month, making them easy to scan/sort
 *   visually and giving customer support an instant sense of order age.
 * - `XXXX` is a 4-digit, zero-padded sequence that resets to 0001 at the
 *   start of every month (upsert on the `year_month` primary key). This
 *   alone is PREDICTABLE and must never be used as the only lookup key.
 * - `RRRRR` is a 5-character cryptographically random suffix (~1.6e7
 *   possibilities from a 32-symbol alphabet). Order tracking is a public,
 *   unauthenticated endpoint (GET /api/orders/:orderCode) that returns the
 *   customer's name, phone, and address — without this random component,
 *   the sequential part alone would let anyone enumerate every order this
 *   month (only ~9999 possible codes) and harvest that PII. The random
 *   suffix makes brute-forcing a specific code computationally infeasible
 *   even before the endpoint's rate limiter kicks in.
 *
 * MUST be called with a transaction client (`tx`) so the increment and the
 * order creation happen in the same atomic unit — this guarantees two
 * concurrent checkouts can never receive the same tracking code, even
 * across the month-boundary edge case.
 */
export async function generateNextOrderCode(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const counter = await tx.orderCounter.upsert({
    where: { yearMonth },
    update: { lastNumber: { increment: 1 } },
    create: { yearMonth, lastNumber: 1 },
  });

  const sequence = String(counter.lastNumber).padStart(4, '0');
  return `SHRQ-${yearMonth}-${sequence}-${randomSuffix()}`;
}
