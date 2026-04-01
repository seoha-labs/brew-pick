import { describe, it, expect } from 'vitest';
import { canVote, isRoomExpired, getRemainingTime } from './rooms';
import { Timestamp } from 'firebase/firestore';
import type { Room } from '../types';

const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'test-room',
  name: 'Test Room',
  creatorId: 'user-1',
  creatorName: 'Test User',
  franchiseId: 'ediya',
  franchiseName: '이디야',
  isClosed: false,
  createdAt: Timestamp.fromDate(new Date()),
  ...overrides,
});

describe('isRoomExpired', () => {
  it('returns false for a room created just now', () => {
    const room = createMockRoom();
    expect(isRoomExpired(room)).toBe(false);
  });

  it('returns true for a room created over 12 hours ago', () => {
    const room = createMockRoom({
      createdAt: Timestamp.fromDate(
        new Date(Date.now() - 13 * 60 * 60 * 1000),
      ),
    });
    expect(isRoomExpired(room)).toBe(true);
  });

  it('returns false for a room created exactly 11 hours ago', () => {
    const room = createMockRoom({
      createdAt: Timestamp.fromDate(
        new Date(Date.now() - 11 * 60 * 60 * 1000),
      ),
    });
    expect(isRoomExpired(room)).toBe(false);
  });
});

describe('canVote', () => {
  it('returns true for an active room', () => {
    const room = createMockRoom();
    expect(canVote(room)).toBe(true);
  });

  it('returns false for a closed room', () => {
    const room = createMockRoom({ isClosed: true });
    expect(canVote(room)).toBe(false);
  });

  it('returns false for an expired room', () => {
    const room = createMockRoom({
      createdAt: Timestamp.fromDate(
        new Date(Date.now() - 13 * 60 * 60 * 1000),
      ),
    });
    expect(canVote(room)).toBe(false);
  });
});

describe('getRemainingTime', () => {
  it('returns positive value for a recent room', () => {
    const room = createMockRoom();
    expect(getRemainingTime(room)).toBeGreaterThan(0);
  });

  it('returns 0 for an expired room', () => {
    const room = createMockRoom({
      createdAt: Timestamp.fromDate(
        new Date(Date.now() - 13 * 60 * 60 * 1000),
      ),
    });
    expect(getRemainingTime(room)).toBe(0);
  });

  it('returns approximately 12 hours for a room created just now', () => {
    const room = createMockRoom();
    const remaining = getRemainingTime(room);
    const twelveHours = 12 * 60 * 60 * 1000;
    expect(remaining).toBeGreaterThan(twelveHours - 1000);
    expect(remaining).toBeLessThanOrEqual(twelveHours);
  });
});
