import { describe, expect, it } from 'vitest';
import { getTechnologyPillIconWidth } from './inline';

describe('getTechnologyPillIconWidth', () => {
  it('includes the visual gap in the cursor advance when an icon is present', () => {
    expect(getTechnologyPillIconWidth(12, true)).toBe(14);
    expect(getTechnologyPillIconWidth(12, false)).toBe(0);
  });
});
