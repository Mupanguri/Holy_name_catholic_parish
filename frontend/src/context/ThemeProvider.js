import React, { createContext, useContext, useState, useEffect } from 'react';
import GlobalTheme from '../components/GlobalTheme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    // Theme is loaded when GlobalTheme component is mounted
    setIsThemeLoaded(true);
  }, []);

  const value = {
    isThemeLoaded,
    // Add any theme-related functions here in the future
  };

  return (
    <ThemeContext.Provider value={value}>
      <GlobalTheme />
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
