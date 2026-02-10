/* ──────────────────────────────────────────────
 *  Mock API Service
 *
 *  Simulates three server behaviours:
 *   1. Immediate success   (200)  — ~40 %
 *   2. Temporary failure   (503)  — ~30 %
 *   3. Delayed success     (200 after 5-10 s) — ~30 %
 *
 *  Tracks idempotency keys to reject duplicates (409).
 * ────────────────────────────────────────────── */

import type { ApiResponse } from '../types';

/** Set of idempotency keys the "server" has already processed successfully */
const processedKeys = new Set<string>();

/** Random integer in [min, max] */
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

/** Simulates a network call with a base latency of 300-800 ms */
const simulateLatency = () =>
    new Promise<void>((resolve) => setTimeout(resolve, randInt(300, 800)));

/**
 * Submit form data to the mock API.
 *
 * @param _data  The form payload (unused by the mock — kept for realism)
 * @param idempotencyKey  UUID that prevents duplicate processing
 */
export async function submitToApi(
    _data: { email: string; amount: number },
    idempotencyKey: string,
): Promise<ApiResponse> {
    await simulateLatency();

    // ── Duplicate guard ──────────────────────────
    if (processedKeys.has(idempotencyKey)) {
        return { ok: true, status: 409, message: 'Duplicate — already processed' };
    }

    const roll = Math.random();

    // ── 40 % → immediate success ────────────────
    if (roll < 0.4) {
        processedKeys.add(idempotencyKey);
        return { ok: true, status: 200, message: 'Submission accepted' };
    }

    // ── 30 % → temporary failure ────────────────
    if (roll < 0.7) {
        return { ok: false, status: 503, message: 'Service temporarily unavailable' };
    }

    // ── 30 % → delayed success (5-10 s) ────────
    const delay = randInt(5000, 10000);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    processedKeys.add(idempotencyKey);
    return { ok: true, status: 200, message: `Submission accepted after ${delay}ms delay` };
}
