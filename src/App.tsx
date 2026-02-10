/* ──────────────────────────────────────────────
 *  App — root component
 * ────────────────────────────────────────────── */

import { SubmissionForm } from './components/SubmissionForm';
import { SubmissionList } from './components/SubmissionList';
import { useSubmission } from './hooks/useSubmission';

export default function App() {
    const { submissions, submit, isSubmitting } = useSubmission();

    return (
        <main className="container">
            <h1>Eventually Consistent Form</h1>
            <p className="subtitle">
                Submit payments to a flaky API — observe retries and eventual consistency.
            </p>

            <SubmissionForm onSubmit={submit} disabled={isSubmitting} />
            <SubmissionList submissions={submissions} />
        </main>
    );
}
