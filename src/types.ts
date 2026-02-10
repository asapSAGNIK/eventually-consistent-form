/* ──────────────────────────────────────────────
 *  Shared types for the Eventually Consistent Form
 * ────────────────────────────────────────────── */

/** Possible states a submission can be in */
export type SubmissionStatus = 'pending' | 'retrying' | 'success' | 'failed';

/** A single form submission record */
export interface Submission {
    /** Unique idempotency key (UUID v4) */
    id: string;
    email: string;
    amount: number;
    status: SubmissionStatus;
    /** Number of retries attempted so far */
    retryCount: number;
    /** Timestamp of original submission */
    createdAt: number;
}

/** Shape returned by the mock API */
export interface ApiResponse {
    ok: boolean;
    status: number;
    message: string;
}
