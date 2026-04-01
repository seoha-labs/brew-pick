import { useEffect, useState } from 'react';
import type { Room } from '../types';
import { getRemainingTime } from '../services/rooms';

export const useRemainingTime = (room: Room | null) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!room) return;

    const update = () => setRemaining(getRemainingTime(room));
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [room]);

  return remaining;
};

export const formatTime = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
