export const TIMEOUT_ERROR_CODE = 'app/timeout';

export class TimeoutError extends Error {
  readonly code = TIMEOUT_ERROR_CODE;

  constructor(label: string, ms: number) {
    super(`${label} did not finish within ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Rejects with a `TimeoutError` if `promise` has not settled after `ms`.
 * Needed for Firebase native calls that can wait forever instead of failing
 * (e.g. Firestore writes waiting for a server acknowledgement that never comes).
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
