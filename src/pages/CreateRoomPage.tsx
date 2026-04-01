import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createRoom } from '../services/rooms';
import { loadFranchises } from '../services/menu';
import { Header } from '../components/common/Header';
import type { Franchise } from '../types';
import styles from './CreateRoomPage.module.css';

export const CreateRoomPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [franchises, setFranchises] = useState<readonly Franchise[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFranchises().then(setFranchises).catch(() => setError('프랜차이즈 목록을 불러올 수 없습니다.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFranchise) return;

    if (!name.trim()) {
      setError('방 이름을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const roomId = await createRoom({
        name: name.trim(),
        creatorId: user.uid,
        creatorName: user.displayName ?? '익명',
        franchiseId: selectedFranchise.id,
        franchiseName: selectedFranchise.name,
        ...(password ? { password } : {}),
      });
      navigate(`/rooms/${roomId}`);
    } catch {
      setError('방 생성에 실패했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.content}>
        <button className={styles.backBtn} onClick={() => navigate('/rooms')}>
          ← 돌아가기
        </button>

        <h2 className={styles.title}>새로운 방 만들기</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>방 이름 *</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="오늘의커피"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호 (선택)</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 설정하면 입장 시 필요합니다"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>프랜차이즈 선택 *</label>
            <div className={styles.franchiseGrid}>
              {franchises.map((f) => (
                <div
                  key={f.id}
                  className={`${styles.franchiseCard} ${
                    selectedFranchise?.id === f.id ? styles.selected : ''
                  }`}
                  onClick={() => setSelectedFranchise(f)}
                >
                  <span className={styles.franchiseName}>{f.name}</span>
                  {selectedFranchise?.id === f.id && (
                    <span className={styles.checkmark}>&#10003; 선택</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || !selectedFranchise || !name.trim()}
          >
            {submitting ? '생성 중...' : '방 만들기'}
          </button>
        </form>
      </div>
    </div>
  );
};
