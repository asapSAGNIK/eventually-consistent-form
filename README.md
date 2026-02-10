# Eventually Consistent Form

A React + TypeScript single-page app demonstrating **eventual consistency** with a flaky API.

## Quick Start

```bash
npm install
npm run dev
```

---

## State Transitions

Each submission follows a finite state machine:

```
                ┌──────────┐
                │  pending  │
                └────┬─────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌──────────┐         ┌──────────┐
    │ success  │         │ retrying │ ◄── 503 received
    └──────────┘         └────┬─────┘
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
             ┌──────────┐         ┌──────────┐
             │ success  │         │  failed  │ ◄── max retries hit
             └──────────┘         └──────────┘
```

| Status     | Meaning                                      |
|------------|----------------------------------------------|
| `pending`  | Request sent, awaiting response               |
| `retrying` | Got a 503, scheduling automatic retry         |
| `success`  | Server accepted the submission (200)          |
| `failed`   | All retry attempts exhausted                  |

---

## Retry Logic

When the mock API returns a **503 (Service Unavailable)**:

1. The submission transitions to `retrying`.
2. A retry is scheduled after an **exponential back-off** delay:
   - Attempt 1 → 1 second
   - Attempt 2 → 2 seconds
   - Attempt 3 → 4 seconds
3. After **3 failed retries**, the submission transitions to `failed`.
4. Each retry reuses the same idempotency key.

---

## Duplicate Prevention

Duplicates are prevented at **two layers**:

### 1. Client-side
- The submit button is **disabled** while any submission is in-flight.
- An in-memory `Set` of in-flight idempotency keys prevents the
  same key from being sent concurrently.

### 2. Server-side (mock API)
- Every submission is tagged with a **UUID v4 idempotency key**.
- The mock API maintains a `Set` of successfully processed keys.
- If a key has already been processed, the API returns **409 Conflict**
  and the client treats it as a success (the original request went through).

This two-layer approach ensures that even under race conditions
(e.g., a retry fires right as the original delayed response arrives),
no duplicate records are created.

---

## Mock API Behaviour

The API randomly simulates one of three outcomes:

| Outcome           | Probability | Response                           |
|-------------------|-------------|------------------------------------|
| Immediate success | 40%         | 200 after 300-800 ms               |
| Temporary failure | 30%         | 503 after 300-800 ms               |
| Delayed success   | 30%         | 200 after 5-10 seconds             |

---

## Tech Stack

- React 18 + TypeScript
- Vite
- No external runtime dependencies (API is in-browser)
