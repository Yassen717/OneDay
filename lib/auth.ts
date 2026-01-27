export interface User {
  name: string;
  email: string;
}

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
};
