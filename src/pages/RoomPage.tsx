import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToRoom, canVote, closeRoom } from '../services/rooms';
import { subscribeToVotes, castVote } from '../services/votes';
import { loadMenu } from '../services/menu';
import { useRemainingTime, formatTime } from '../hooks/useRemainingTime';
import { Header } from '../components/common/Header';
import type { Room, Vote, MenuItem } from '../types';
import styles from './RoomPage.module.css';

export const RoomPage = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [votes, setVotes] = useState<readonly Vote[]>([]);
  const [menuItems, setMenuItems] = useState<readonly MenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [selectedTemp, setSelectedTemp] = useState<'ICE' | 'HOT'>('ICE');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const remaining = useRemainingTime(room);

  useEffect(() => {
    if (!roomId) return;

    const unsubRoom = subscribeToRoom(roomId, (r) => {
      setRoom(r);
      if (r) {
        loadMenu(r.franchiseId).then(setMenuItems).catch(() => {});
      }
      setLoading(false);
    });

    const unsubVotes = subscribeToVotes(roomId, setVotes);

    return () => {
      unsubRoom();
      unsubVotes();
    };
  }, [roomId]);

  useEffect(() => {
    if (!user) return;
    const myVote = votes.find((v) => v.userId === user.uid);
    if (myVote) {
      setSelectedMenu(myVote.menuItemId);
      setSelectedTemp(myVote.temperature);
    }
  }, [votes, user]);

  const inferTemp = (itemName: string): 'ICE' | 'HOT' => {
    if (itemName.includes('HOT')) return 'HOT';
    return 'ICE';
  };

  const handleVote = async (item: MenuItem) => {
    if (!room || !user || !roomId || !canVote(room)) return;

    const newMenuId = item.id;
    const newTemp = showTempToggle
      ? (selectedMenu === newMenuId ? selectedTemp : 'ICE')
      : inferTemp(item.name);

    setSelectedMenu(newMenuId);
    setSelectedTemp(newTemp);

    await castVote(roomId, {
      userId: user.uid,
      userName: user.displayName ?? '익명',
      menuItemId: newMenuId,
      menuItemName: item.name,
      temperature: newTemp,
    });
  };

  const handleTempToggle = async (item: MenuItem, temp: 'ICE' | 'HOT') => {
    if (!room || !user || !roomId || !canVote(room)) return;

    setSelectedMenu(item.id);
    setSelectedTemp(temp);

    await castVote(roomId, {
      userId: user.uid,
      userName: user.displayName ?? '익명',
      menuItemId: item.id,
      menuItemName: item.name,
      temperature: temp,
    });
  };

  const handleClose = async () => {
    if (!roomId) return;
    await closeRoom(roomId);
    setShowCloseModal(false);
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!room) return <div className="loading">방을 찾을 수 없습니다.</div>;

  const isCreator = user?.uid === room.creatorId;
  const votingOpen = canVote(room);
  const categories = [...new Set(menuItems.map((m) => m.category ?? '기타'))];
  const showTempToggle = room.franchiseId !== 'ediya';

  // Build order summary
  const votesByMenu = new Map<string, { ice: number; hot: number; voters: readonly { name: string; temp: string }[] }>();
  for (const v of votes) {
    const existing = votesByMenu.get(v.menuItemName) ?? { ice: 0, hot: 0, voters: [] };
    votesByMenu.set(v.menuItemName, {
      ice: existing.ice + (v.temperature === 'ICE' ? 1 : 0),
      hot: existing.hot + (v.temperature === 'HOT' ? 1 : 0),
      voters: [...existing.voters, { name: v.userName, temp: v.temperature }].toSorted((a, b) => a.name.localeCompare(b.name, 'ko')),
    });
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => navigate('/rooms')}>
          ← 목록으로
        </button>

        <div className={styles.roomInfo}>
          <div className={styles.roomHeader}>
            <h2 className={styles.roomName}>{room.name}</h2>
            {isCreator && <span className={styles.crownBadge}>👑 방장</span>}
            {!votingOpen && <span className={styles.closedBadge}>🔴 투표 종료</span>}
          </div>
          <p className={styles.roomMeta}>
            {room.franchiseName} · {room.creatorName}
            {votingOpen && ` · 남은 시간 ${formatTime(remaining)}`}
          </p>
          <p className={styles.roomMeta}>참여 {votes.length}명</p>
        </div>

        {isCreator && votingOpen && (
          <button
            className={styles.closeBtn}
            onClick={() => setShowCloseModal(true)}
          >
            🛑 투표 종료하기
          </button>
        )}

        {/* Menu selection */}
        {votingOpen && (
          <div className={styles.menuSection}>
            {categories.map((category) => (
              <div key={category}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <div className={styles.menuGrid}>
                  {menuItems
                    .filter((m) => (m.category ?? '기타') === category)
                    .map((item) => {
                      const isSelected = selectedMenu === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`${styles.menuCard} ${isSelected ? styles.menuSelected : ''}`}
                          onClick={() => handleVote(item)}
                        >
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className={styles.menuImage}
                              loading="lazy"
                            />
                          )}
                          <span className={styles.menuName}>{item.name}</span>
                          {showTempToggle && (
                          <div className={styles.tempToggle}>
                            <button
                              className={`${styles.tempBtn} ${
                                isSelected && selectedTemp === 'ICE'
                                  ? styles.tempActive
                                  : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTempToggle(item, 'ICE');
                              }}
                            >
                              🧊
                            </button>
                            <button
                              className={`${styles.tempBtn} ${
                                isSelected && selectedTemp === 'HOT'
                                  ? styles.tempActive
                                  : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTempToggle(item, 'HOT');
                              }}
                            >
                              ☕
                            </button>
                          </div>
                          )}
                          {isSelected && <span className={styles.checkmark}>✅ 선택</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order summary */}
        <div className={styles.resultSection}>
          <h3 className={styles.sectionTitle}>📋 주문 요약</h3>
          {votesByMenu.size > 0 ? (
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>메뉴</th>
                  <th>ICE</th>
                  <th>HOT</th>
                  <th>합계</th>
                </tr>
              </thead>
              <tbody>
                {[...votesByMenu.entries()].map(([menuName, data]) => (
                  <tr key={menuName}>
                    <td>{menuName}</td>
                    <td>{data.ice}</td>
                    <td>{data.hot}</td>
                    <td>{data.ice + data.hot}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>총 주문</td>
                  <td></td>
                  <td></td>
                  <td>{votes.length}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className={styles.noVotes}>아직 투표가 없습니다.</p>
          )}
        </div>

        {/* Vote details */}
        <div className={styles.resultSection}>
          <h3 className={styles.sectionTitle}>👤 주문 상세</h3>
          {[...votesByMenu.entries()].map(([menuName, data]) => (
            <div key={menuName} className={styles.detailGroup}>
              <h4 className={styles.detailMenuName}>
                {menuName} ({data.voters.length})
              </h4>
              <ul className={styles.detailList}>
                {data.voters.map((voter) => (
                  <li key={voter.name}>
                    {voter.name} - {voter.temp === 'ICE' ? '🧊 ICE' : '☕ HOT'}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Close modal */}
      {showCloseModal && (
        <div className={styles.overlay} onClick={() => setShowCloseModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>정말 투표를 종료할까요?</h3>
            <p>종료하면 더 이상 투표할 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowCloseModal(false)}
              >
                취소
              </button>
              <button className={styles.confirmCloseBtn} onClick={handleClose}>
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
