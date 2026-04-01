import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Room } from '../types';

const ROOMS_COLLECTION = 'rooms';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const createRoom = async (params: {
  readonly name: string;
  readonly creatorId: string;
  readonly creatorName: string;
  readonly franchiseId: string;
  readonly franchiseName: string;
  readonly password?: string;
}) => {
  const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
    ...params,
    isClosed: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  const docSnap = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Room;
};

export const closeRoom = async (roomId: string) => {
  await updateDoc(doc(db, ROOMS_COLLECTION, roomId), { isClosed: true });
};

export const subscribeToActiveRooms = (
  callback: (rooms: readonly Room[]) => void,
): Unsubscribe => {
  const twelveHoursAgo = Timestamp.fromDate(
    new Date(Date.now() - TWELVE_HOURS_MS),
  );

  const q = query(
    collection(db, ROOMS_COLLECTION),
    where('createdAt', '>', twelveHoursAgo),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Room,
    );
    callback(rooms);
  });
};

export const subscribeToRoom = (
  roomId: string,
  callback: (room: Room | null) => void,
): Unsubscribe => {
  return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    callback({ id: docSnap.id, ...docSnap.data() } as Room);
  });
};

export const isRoomExpired = (room: Room): boolean => {
  if (!room.createdAt) return false;
  const elapsed = Date.now() - room.createdAt.toMillis();
  return elapsed >= TWELVE_HOURS_MS;
};

export const canVote = (room: Room): boolean => {
  if (room.isClosed) return false;
  return !isRoomExpired(room);
};

export const getRemainingTime = (room: Room): number => {
  if (!room.createdAt) return 0;
  const remaining = TWELVE_HOURS_MS - (Date.now() - room.createdAt.toMillis());
  return Math.max(0, remaining);
};
