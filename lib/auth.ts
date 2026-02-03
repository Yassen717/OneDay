export interface User {
  name: string;
  email: string;
}

// Token is now stored in httpOnly cookie (set by server), not accessible by JavaScript
// This is more secure as it prevents XSS attacks from stealing the token

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('oneday-user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User) => {
  localStorage.setItem('oneday-user', JSON.stringify(user));
};

export const logout = async () => {
  localStorage.removeItem('oneday-user');
  // Server will clear the httpOnly cookie
  await fetch('/api/auth/logout', { method: 'POST' });
};

export const register = async (email: string, password: string, name: string) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  // Token is set as httpOnly cookie by server, we only store user info for display
  setUser(data.user);
  return data;
};

export const login = async (email: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  // Token is set as httpOnly cookie by server, we only store user info for display
  setUser(data.user);
  return data;
};

export const verifyToken = async () => {
  // Cookie is automatically sent by browser
  const res = await fetch('/api/auth/verify');
  if (!res.ok) {
    logout();
    return null;
  }
  const data = await res.json();
  return data.user;
};
