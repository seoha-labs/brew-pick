import type { Timestamp } from 'firebase/firestore';

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly creatorId: string;
  readonly creatorName: string;
  readonly franchiseId: string;
  readonly franchiseName: string;
  readonly password?: string;
  readonly isClosed: boolean;
  readonly createdAt: Timestamp;
}

export interface Vote {
  readonly userId: string;
  readonly userName: string;
  readonly menuItemId: string;
  readonly menuItemName: string;
  readonly temperature: 'ICE' | 'HOT';
  readonly votedAt: Timestamp;
}

export interface Franchise {
  readonly id: string;
  readonly name: string;
  readonly logoUrl?: string;
}

export interface MenuItem {
  readonly id: string;
  readonly franchiseId: string;
  readonly name: string;
  readonly category?: string;
  readonly imageUrl?: string;
}
