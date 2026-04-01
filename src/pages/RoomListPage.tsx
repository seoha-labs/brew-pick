import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToActiveRooms, isRoomExpired, getRemainingTime } from '../services/rooms';
import { PasswordModal } from '../components/common/PasswordModal';
import { Header } from '../components/common/Header';
import type { Room } from '../types';
import { formatTime } from '../hooks/useRemainingTime';
import styles from './RoomListPage.module.css';

export const RoomListPage = () => {
  const [rooms, setRooms] = useState<readonly Room[]>([]);
  const [passwordTarget, setPasswordTarget] = useState<Room | null>(null);
  const [passwordError, setPasswordError] = useState('');
  const [, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms(setRooms);
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRoomClick = (room: Room) => {
    if (room.password) {
      setPasswordTarget(room);
      setPasswordError('');
    } else {
      navigate(`/rooms/${room.id}`);
    }
  };

  const handlePasswordConfirm = (password: string) => {
    if (!passwordTarget) return;
    if (password === passwordTarget.password) {
      navigate(`/rooms/${passwordTarget.id}`);
      setPasswordTarget(null);
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    }
  };

  const getVoteCount = (_room: Room) => {
    // Vote count is shown on the room detail page
    return '';
  };

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>활성 방 목록</h2>
          <button
            className={styles.createBtn}
            onClick={() => navigate('/rooms/new')}
          >
            + 방 만들기
          </button>
        </div>

        {rooms.length === 0 && (
          <p className={styles.empty}>방이 없나요? 새로운 방을 만들어보세요!</p>
        )}

        <div className={styles.roomList}>
          {rooms.map((room) => {
            const expired = isRoomExpired(room);
            const closed = room.isClosed || expired;

            return (
              <div
                key={room.id}
                className={`${styles.roomCard} ${closed ? styles.closed : ''}`}
                onClick={() => handleRoomClick(room)}
              >
                <div className={styles.roomHeader}>
                  <span className={styles.roomName}>{room.name}</span>
                  <span className={styles.badges}>
                    {room.password && <span className={styles.lockBadge}>🔒</span>}
                    {closed && <span className={styles.closedBadge}>종료됨</span>}
                  </span>
                </div>
                <div className={styles.roomInfo}>
                  {room.franchiseName} · {room.creatorName}
                  {getVoteCount(room)}
                </div>
                <div className={styles.roomTime}>
                  {closed
                    ? '(투표 종료)'
                    : `남은 시간: ${formatTime(getRemainingTime(room))}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {passwordTarget && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onCancel={() => setPasswordTarget(null)}
          error={passwordError}
        />
      )}
    </div>
  );
};
