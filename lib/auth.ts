export interface User {
  name: string;
  email: string;
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oneday-token');
};

export const setToken = (token: string) => {
  localStorage.setItem('oneday-token', token);
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('oneday-user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User) => {
  localStorage.setItem('oneday-user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('oneday-user');
  localStorage.removeItem('oneday-token');
};

export const register = async (email: string, password: string, name: string) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  setToken(data.token);
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
  setToken(data.token);
  setUser(data.user);
  return data;
};

export const verifyToken = async () => {
  const token = getToken();
  if (!token) return null;
  
  const res = await fetch('/api/auth/verify', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    logout();
    return null;
  }
  const data = await res.json();
  return data.user;
};
