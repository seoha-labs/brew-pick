import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/auth';
import styles from './Header.module.css';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <a href="#/" className={styles.logo}>
        Brew Pick
      </a>
      {user && (
        <div className={styles.userArea}>
          <span className={styles.userName}>{user.displayName}</span>
          <button className={styles.logoutBtn} onClick={logout}>
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
};
