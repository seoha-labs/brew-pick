import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Vote } from '../types';

const votesCollection = (roomId: string) =>
  collection(db, 'rooms', roomId, 'votes');

export const castVote = async (
  roomId: string,
  vote: {
    readonly userId: string;
    readonly userName: string;
    readonly menuItemId: string;
    readonly menuItemName: string;
    readonly temperature: 'ICE' | 'HOT';
  },
) => {
  await setDoc(doc(votesCollection(roomId), vote.userId), {
    ...vote,
    votedAt: serverTimestamp(),
  });
};

export const subscribeToVotes = (
  roomId: string,
  callback: (votes: readonly Vote[]) => void,
): Unsubscribe => {
  return onSnapshot(votesCollection(roomId), (snapshot) => {
    const votes = snapshot.docs.map((d) => d.data() as Vote);
    callback(votes);
  });
};
