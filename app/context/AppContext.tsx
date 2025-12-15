'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

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
  const [darkMode, setDarkMode] = useState(true);
  const [show3DView, setShow3DView] = useState(false);
  const [visualStatus, setVisualStatus] = useState<VisualStatus>('pNodes_Explore');

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