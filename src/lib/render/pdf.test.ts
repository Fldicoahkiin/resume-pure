import { describe, expect, it } from 'vitest';
import { createPdfSubsetFontName } from './pdf';

describe('PDF subset font names', () => {
  it('uses the six-letter subset prefix recognized by PDF readers', () => {
    const regular = createPdfSubsetFontName({
      family: 'Noto Sans SC',
      weight: 400,
      style: 'normal',
    }, 0);
    const bold = createPdfSubsetFontName({
      family: 'Noto Sans SC',
      weight: 700,
      style: 'normal',
    }, 1);

    expect(regular).toMatch(/^[A-Z]{6}\+[A-Za-z0-9-]+$/);
    expect(bold).toMatch(/^[A-Z]{6}\+[A-Za-z0-9-]+$/);
    expect(bold).not.toBe(regular);
  });
});
