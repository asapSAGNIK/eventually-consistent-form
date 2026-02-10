/* ──────────────────────────────────────────────
 *  SubmissionList — card-based layout with state visualization
 * ────────────────────────────────────────────── */

import type { Submission, SubmissionStatus } from '../types';

interface Props {
    submissions: Submission[];
}

/** Status config: icon, label, CSS modifier, step index for progress bar */
const STATUS_CONFIG: Record<
    SubmissionStatus,
    { icon: string; label: string; modifier: string; step: number }
> = {
    pending: { icon: '◌', label: 'Pending', modifier: 'pending', step: 1 },
    retrying: { icon: '↻', label: 'Retrying', modifier: 'retrying', step: 2 },
    success: { icon: '✓', label: 'Success', modifier: 'success', step: 3 },
    failed: { icon: '✕', label: 'Failed', modifier: 'failed', step: 3 },
};

/** Progress dots for the 3-step lifecycle */
function ProgressDots({ status }: { status: SubmissionStatus }) {
    const config = STATUS_CONFIG[status];
    const steps = ['Sent', 'Processing', status === 'failed' ? 'Failed' : 'Done'];

    return (
        <div className="progress">
            {steps.map((stepLabel, i) => {
                const stepNum = i + 1;
                const isActive = stepNum <= config.step;
                const isCurrent = stepNum === config.step;
                const dotClass = [
                    'progress__dot',
                    isActive ? `progress__dot--${config.modifier}` : '',
                    isCurrent && (status === 'pending' || status === 'retrying')
                        ? 'progress__dot--pulse'
                        : '',
                ].join(' ');

                return (
                    <div key={stepLabel} className="progress__step">
                        <div className={dotClass} />
                        <span className="progress__label">{stepLabel}</span>
                        {i < steps.length - 1 && (
                            <div
                                className={`progress__line ${isActive ? `progress__line--${config.modifier}` : ''}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function SubmissionList({ submissions }: Props) {
    if (submissions.length === 0) {
        return <p className="empty">No submissions yet — fill in the form above.</p>;
    }

    return (
        <section className="submissions">
            <h2>Submissions</h2>
            <div className="card-list">
                {submissions.map((s) => {
                    const config = STATUS_CONFIG[s.status];
                    return (
                        <div key={s.id} className={`card card--${config.modifier}`}>
                            <div className="card__header">
                                <span className={`card__icon card__icon--${config.modifier}`}>
                                    {config.icon}
                                </span>
                                <span className="card__status">{config.label}</span>
                                <span className="card__time">
                                    {new Date(s.createdAt).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="card__body">
                                <div className="card__field">
                                    <span className="card__field-label">Email</span>
                                    <span className="card__field-value">{s.email}</span>
                                </div>
                                <div className="card__field">
                                    <span className="card__field-label">Amount</span>
                                    <span className="card__field-value">${s.amount.toFixed(2)}</span>
                                </div>
                                {s.retryCount > 0 && (
                                    <div className="card__field">
                                        <span className="card__field-label">Retries</span>
                                        <span className="card__field-value">{s.retryCount} / 3</span>
                                    </div>
                                )}
                            </div>

                            <ProgressDots status={s.status} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
