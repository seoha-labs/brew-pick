import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFranchises, loadMenu } from './menu';

const mockFranchises = [
  { id: 'ediya', name: '이디야' },
  { id: 'twosome', name: '투썸플레이스' },
];

const mockMenu = [
  { id: 'ediya-1', franchiseId: 'ediya', name: '아메리카노', category: '커피' },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('franchises.json')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockFranchises),
        });
      }
      if (url.includes('ediya.json')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockMenu),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    }),
  );
});

describe('loadFranchises', () => {
  it('fetches and returns franchise list', async () => {
    const result = await loadFranchises();
    expect(result).toEqual(mockFranchises);
  });
});

describe('loadMenu', () => {
  it('fetches and returns menu items for a franchise', async () => {
    const result = await loadMenu('ediya');
    expect(result).toEqual(mockMenu);
  });
});
