import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isNavigationVisible: boolean;
  hideNavigation: () => void;
  showNavigation: () => void;
  setNavigationVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  const hideNavigation = () => {
    setIsNavigationVisible(false);
  };

  const showNavigation = () => {
    setIsNavigationVisible(true);
  };

  const setNavigationVisible = (visible: boolean) => {
    setIsNavigationVisible(visible);
  };

  const value: NavigationContextType = {
    isNavigationVisible,
    hideNavigation,
    showNavigation,
    setNavigationVisible,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};