import { describe, expect, it, vi } from 'vitest';
import { FontContextCache } from './fontContextCache';

describe('FontContextCache', () => {
  it('waits for active renders before disposing a replaced font context', async () => {
    const dispose = vi.fn();
    const cache = new FontContextCache(async (key) => ({ key }), dispose);
    const first = await cache.acquire('sans');

    const second = await cache.acquire('serif');
    expect(dispose).not.toHaveBeenCalled();

    first.release();
    expect(dispose).toHaveBeenCalledWith({ key: 'sans' });

    second.release();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('shares the current context between concurrent renders', async () => {
    const load = vi.fn(async (key: string) => ({ key }));
    const cache = new FontContextCache(load, vi.fn());

    const [first, second] = await Promise.all([
      cache.acquire('sans'),
      cache.acquire('sans'),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(first.value).toBe(second.value);
    first.release();
    second.release();
  });
});
