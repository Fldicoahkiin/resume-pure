import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout } from './fetchWithTimeout';

describe('fetchWithTimeout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('aborts a request after the configured deadline', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_: RequestInfo | URL, init?: RequestInit) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    })));

    const pending = fetchWithTimeout('https://example.com', {}, 25);
    const assertion = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(25);

    await assertion;
  });

  it('forwards cancellation from the caller', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn((_: RequestInfo | URL, init?: RequestInit) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    })));

    const pending = fetchWithTimeout('https://example.com', { signal: controller.signal }, 5_000);
    controller.abort(new Error('cancelled'));

    await expect(pending).rejects.toThrow('cancelled');
  });
});
