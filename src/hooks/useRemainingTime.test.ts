import { describe, it, expect } from 'vitest';
import { formatTime } from './useRemainingTime';

describe('formatTime', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('formats negative values as 00:00:00', () => {
    expect(formatTime(-1000)).toBe('00:00:00');
  });

  it('formats hours, minutes, seconds correctly', () => {
    const ms = 8 * 3600000 + 32 * 60000 + 15 * 1000;
    expect(formatTime(ms)).toBe('08:32:15');
  });

  it('formats exact 12 hours', () => {
    expect(formatTime(12 * 3600000)).toBe('12:00:00');
  });

  it('formats 1 second', () => {
    expect(formatTime(1000)).toBe('00:00:01');
  });

  it('formats 59 minutes 59 seconds', () => {
    const ms = 59 * 60000 + 59 * 1000;
    expect(formatTime(ms)).toBe('00:59:59');
  });
});
