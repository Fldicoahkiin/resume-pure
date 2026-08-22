import type { RenderDrawOp } from './types';
import { describe, expect, it } from 'vitest';
import { prefetchRenderImages } from './renderImagePrefetch';

function imageOp(src: string): RenderDrawOp {
  return { kind: 'image', src, x: 0, y: 0, width: 24, height: 24, fit: 'contain' };
}

describe('prefetchRenderImages', () => {
  it('loads each image once with bounded concurrency', async () => {
    let active = 0;
    let peak = 0;
    const loaded: string[] = [];
    const operations = [
      imageOp('one'),
      imageOp('two'),
      imageOp('one'),
      imageOp('three'),
    ];

    const results = await prefetchRenderImages(operations, async (src) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      loaded.push(src);
      active -= 1;
      return src.toUpperCase();
    }, 2);

    expect(loaded.sort()).toEqual(['one', 'three', 'two']);
    expect(peak).toBeLessThanOrEqual(2);
    expect(results.get('one')).toBe('ONE');
  });
});
