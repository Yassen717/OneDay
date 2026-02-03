'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotesContextType {
  refreshNotes: () => void;
  registerRefreshCallback: (callback: () => void) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [refreshCallback, setRefreshCallback] = useState<(() => void) | null>(null);

  const registerRefreshCallback = useCallback((callback: () => void) => {
    setRefreshCallback(() => callback);
  }, []);

  const refreshNotes = useCallback(() => {
    if (refreshCallback) {
      refreshCallback();
    }
  }, [refreshCallback]);

  return (
    <NotesContext.Provider value={{ refreshNotes, registerRefreshCallback }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
