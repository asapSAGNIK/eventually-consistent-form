/* ──────────────────────────────────────────────
 *  useSubmission — manages form submission lifecycle
 *
 *  Responsibilities:
 *   • Generates a content-based idempotency key (hash of email+amount)
 *   • Tracks each submission's state (pending → success | retrying → …)
 *   • Retries on 503 with exponential back-off (max 3 attempts)
 *   • Prevents duplicate submits:
 *       – Content-based: same email+amount won't create a second record
 *       – Concurrency: in-flight guard prevents parallel calls
 * ────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react';
import type { Submission } from '../types';
import { submitToApi } from '../services/mockApi';

const MAX_RETRIES = 3;

/** Exponential back-off: 1 s × 2^attempt */
const backoffMs = (attempt: number) => 1000 * Math.pow(2, attempt);

/**
 * Deterministic idempotency key from form content.
 * Same email + amount always produces the same key,
 * so re-submitting identical data is caught as a duplicate.
 */
const contentKey = (email: string, amount: number): string =>
    `${email.toLowerCase().trim()}::${amount}`;

export function useSubmission() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Tracks content keys that are currently in-flight OR
     * successfully processed, preventing duplicates.
     */
    const knownKeys = useRef(new Set<string>());

    /** Immutably update a single submission by its id */
    const updateSubmission = useCallback(
        (id: string, patch: Partial<Submission>) => {
            setSubmissions((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            );
        },
        [],
    );

    /**
     * Core retry loop for a single submission.
     * Resolves when the submission reaches a terminal state.
     */
    const processSubmission = useCallback(
        async (sub: Submission) => {
            let attempt = 0;

            while (attempt <= MAX_RETRIES) {
                const res = await submitToApi(
                    { email: sub.email, amount: sub.amount },
                    sub.id,
                );

                // ── Success (200) or duplicate (409 — already processed) ──
                if (res.ok) {
                    updateSubmission(sub.id, { status: 'success', retryCount: attempt });
                    return;
                }

                // ── Temporary failure (503) — schedule retry ──
                if (res.status === 503 && attempt < MAX_RETRIES) {
                    attempt++;
                    updateSubmission(sub.id, { status: 'retrying', retryCount: attempt });
                    await new Promise<void>((r) => setTimeout(r, backoffMs(attempt)));
                    continue;
                }

                // ── Exhausted retries or non-retryable error ──
                updateSubmission(sub.id, { status: 'failed', retryCount: attempt });
                // Remove from known keys so user can retry this content
                knownKeys.current.delete(sub.id);
                return;
            }
        },
        [updateSubmission],
    );

    /** Submit a new form entry */
    const submit = useCallback(
        async (email: string, amount: number): Promise<string | null> => {
            const key = contentKey(email, amount);

            // ── Content-based duplicate guard ──
            if (knownKeys.current.has(key)) {
                return 'This exact submission already exists or is in progress.';
            }
            knownKeys.current.add(key);

            const newSub: Submission = {
                id: key,
                email,
                amount,
                status: 'pending',
                retryCount: 0,
                createdAt: Date.now(),
            };

            setSubmissions((prev) => [newSub, ...prev]);
            setIsSubmitting(true);

            await processSubmission(newSub);

            setIsSubmitting(false);
            return null; // no error
        },
        [processSubmission],
    );

    return { submissions, submit, isSubmitting } as const;
}
