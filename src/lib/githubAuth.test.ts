import { afterEach, describe, expect, it, vi } from 'vitest';
import { exchangeDeviceCode, getStoredUser } from './githubAuth';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('exchangeDeviceCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('stops polling when the device code expires', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'authorization_pending',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const pending = exchangeDeviceCode('device-code', 1, 2);
    const assertion = expect(pending).rejects.toThrow('expired');
    await vi.advanceTimersByTimeAsync(2_000);

    await assertion;
  });

  it('stops polling when the caller cancels the login', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = exchangeDeviceCode('device-code', 5, 900, controller.signal);
    controller.abort(new Error('cancelled'));

    await expect(pending).rejects.toThrow('cancelled');
  });

  it('rejects unexpected provider errors instead of polling forever', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'incorrect_device_code',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    const pending = exchangeDeviceCode('device-code', 1, 900);
    const assertion = expect(pending).rejects.toThrow('token-exchange-failed');
    await vi.advanceTimersByTimeAsync(5_000);

    await assertion;
  });
});

describe('getStoredUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects stored values that do not match the GitHub user boundary', () => {
    const session = new MemoryStorage();
    session.setItem('resume-pure:github-user', JSON.stringify({ login: 42 }));
    vi.stubGlobal('sessionStorage', session);
    vi.stubGlobal('localStorage', new MemoryStorage());
    vi.stubGlobal('window', {});

    expect(getStoredUser()).toBeNull();
  });
});
