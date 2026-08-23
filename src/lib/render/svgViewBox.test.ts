import { describe, expect, it } from 'vitest';
import { fitSvgPathViewBox } from './svgViewBox';

describe('fitSvgPathViewBox', () => {
  it('preserves the existing 24 by 24 path scaling', () => {
    expect(fitSvgPathViewBox({ x: 2, y: 3, width: 12, height: 18 })).toEqual({
      originX: 2,
      originY: 3,
      scaleX: 0.5,
      scaleY: 0.75,
    });
  });

  it('centers a non-square view box without stretching it', () => {
    expect(fitSvgPathViewBox({
      x: 10,
      y: 20,
      width: 24,
      height: 24,
      viewBox: { x: 100, y: 50, width: 200, height: 100 },
    })).toEqual({
      originX: -2,
      originY: 20,
      scaleX: 0.12,
      scaleY: 0.12,
    });
  });
});
