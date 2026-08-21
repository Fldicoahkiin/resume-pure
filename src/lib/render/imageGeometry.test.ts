import { describe, expect, it } from 'vitest';
import { fitRenderImage } from './imageGeometry';

const BOX = { x: 10, y: 20, width: 40, height: 40 };

describe('fitRenderImage', () => {
  it('centers a wide image without stretching in contain mode', () => {
    expect(fitRenderImage(BOX, { width: 200, height: 100 }, 'contain')).toEqual({
      x: 10,
      y: 30,
      width: 40,
      height: 20,
    });
  });

  it('centers a wide image beyond the box in cover mode', () => {
    expect(fitRenderImage(BOX, { width: 200, height: 100 }, 'cover')).toEqual({
      x: -10,
      y: 20,
      width: 80,
      height: 40,
    });
  });

  it('keeps the destination box when no fit mode is selected', () => {
    expect(fitRenderImage(BOX, { width: 200, height: 100 })).toEqual(BOX);
  });
});
