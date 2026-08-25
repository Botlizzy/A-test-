export function isTransientAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch|networkerror|load failed|network request failed|timeout|timed out/i.test(message);
}

export async function withTransientAuthRetry<T>(
  request: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; onRetry?: (attempt: number) => void } = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const delayMs = Math.max(0, options.delayMs ?? 650);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isTransientAuthError(error) || attempt === attempts) throw error;
      options.onRetry?.(attempt);
      await new Promise((resolve) => globalThis.setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Authentication request failed.");
}
