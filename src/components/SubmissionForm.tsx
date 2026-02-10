/* ──────────────────────────────────────────────
 *  SubmissionForm — email + amount form
 * ────────────────────────────────────────────── */

import { type FormEvent, useState } from 'react';

interface Props {
    onSubmit: (email: string, amount: number) => Promise<string | null>;
    disabled: boolean;
}

export function SubmissionForm({ onSubmit, disabled }: Props) {
    const [email, setEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // ── Basic client-side validation ──
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
            setError('Enter a valid email address');
            return;
        }

        const num = Number(amount);
        if (!amount.trim() || isNaN(num) || num <= 0) {
            setError('Amount must be a positive number');
            return;
        }

        const dupeError = await onSubmit(email.trim(), num);
        if (dupeError) {
            setError(dupeError);
            return;
        }

        setEmail('');
        setAmount('');
    };

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h2>Submit Payment</h2>

            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
            />

            <label htmlFor="amount">Amount</label>
            <input
                id="amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />

            {error && <p className="form-error">{error}</p>}

            <button type="submit" disabled={disabled}>
                {disabled ? 'Submitting…' : 'Submit'}
            </button>
        </form>
    );
}
