import { useState } from 'react';
import styles from './PasswordModal.module.css';

interface Props {
  readonly onConfirm: (password: string) => void;
  readonly onCancel: () => void;
  readonly error?: string;
}

export const PasswordModal = ({ onConfirm, onCancel, error }: Props) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>비밀번호를 입력하세요</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              취소
            </button>
            <button type="submit" className={styles.confirmBtn}>
              입장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
