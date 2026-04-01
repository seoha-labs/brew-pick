import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

vi.mock('../services/auth', () => ({
  loginWithGoogle: vi.fn(),
}));

describe('LoginPage', () => {
  it('renders the title and login button', () => {
    render(<LoginPage />);
    expect(screen.getByText('Brew Pick')).toBeInTheDocument();
    expect(screen.getByText('Google로 로그인')).toBeInTheDocument();
    expect(screen.getByText('Google 계정으로 로그인하세요')).toBeInTheDocument();
  });

  it('calls loginWithGoogle when button is clicked', async () => {
    const { loginWithGoogle } = await import('../services/auth');
    render(<LoginPage />);
    const button = screen.getByText('Google로 로그인');
    await userEvent.click(button);
    expect(loginWithGoogle).toHaveBeenCalled();
  });

  it('shows error message when login fails', async () => {
    const { loginWithGoogle } = await import('../services/auth');
    vi.mocked(loginWithGoogle).mockRejectedValueOnce(
      new Error('로그인에 실패했습니다.'),
    );
    render(<LoginPage />);
    await userEvent.click(screen.getByText('Google로 로그인'));
    expect(
      await screen.findByText('로그인에 실패했습니다.'),
    ).toBeInTheDocument();
  });
});
