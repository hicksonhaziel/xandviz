'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

type VisualStatus = 'pNodes_Explore' | 'Network_3D' | 'pNodes_Analysis';

interface AppContextType {
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  show3DView: boolean;
  setShow3DView: Dispatch<SetStateAction<boolean>>;
  visualStatus: VisualStatus;
  setVisualStatus: Dispatch<SetStateAction<VisualStatus>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or use defaults
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [show3DView, setShow3DView] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('show3DView');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [visualStatus, setVisualStatus] = useState<VisualStatus>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('visualStatus');
      return saved !== null ? JSON.parse(saved) : 'pNodes_Explore';
    }
    return 'pNodes_Explore';
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('show3DView', JSON.stringify(show3DView));
  }, [show3DView]);

  useEffect(() => {
    localStorage.setItem('visualStatus', JSON.stringify(visualStatus));
  }, [visualStatus]);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        show3DView,
        setShow3DView,
        visualStatus,
        setVisualStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}