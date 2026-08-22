import type { Image } from 'canvaskit-wasm';
import { describe, expect, it, vi } from 'vitest';
import { RenderImageCache } from './renderImageCache';

function createImage() {
  return { delete: vi.fn() } as unknown as Image;
}

describe('RenderImageCache', () => {
  it('evicts the least recently used decoded image', async () => {
    const cache = new RenderImageCache(2);
    const firstImage = createImage();
    const secondImage = createImage();
    const thirdImage = createImage();

    const first = await cache.acquire('first', async () => firstImage);
    first.release();
    const second = await cache.acquire('second', async () => secondImage);
    second.release();
    const firstAgain = await cache.acquire('first', async () => firstImage);
    firstAgain.release();
    const third = await cache.acquire('third', async () => thirdImage);
    third.release();

    expect(secondImage.delete).toHaveBeenCalledOnce();
    expect(firstImage.delete).not.toHaveBeenCalled();
    expect(thirdImage.delete).not.toHaveBeenCalled();
  });

  it('does not delete an evicted image until its active render releases it', async () => {
    const cache = new RenderImageCache(1);
    const activeImage = createImage();
    const replacementImage = createImage();
    const active = await cache.acquire('active', async () => activeImage);

    const replacement = await cache.acquire('replacement', async () => replacementImage);
    replacement.release();
    expect(activeImage.delete).not.toHaveBeenCalled();

    active.release();
    expect(activeImage.delete).toHaveBeenCalledOnce();
  });

  it('retries a source after decoding fails', async () => {
    const cache = new RenderImageCache(1);
    const load = vi.fn()
      .mockRejectedValueOnce(new Error('decode failed'))
      .mockResolvedValueOnce(createImage());

    await expect(cache.acquire('logo', load)).rejects.toThrow('decode failed');
    const retry = await cache.acquire('logo', load);
    retry.release();

    expect(load).toHaveBeenCalledTimes(2);
  });
});
