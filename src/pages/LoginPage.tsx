import { useState } from 'react';
import { loginWithGoogle } from '../services/auth';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Brew Pick</h1>
        <p className={styles.subtitle}>매달 커피, 골라 마시자</p>
        <button className={styles.loginBtn} onClick={handleLogin}>
          Google로 로그인
        </button>
        <p className={styles.hint}>Google 계정으로 로그인하세요</p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};
