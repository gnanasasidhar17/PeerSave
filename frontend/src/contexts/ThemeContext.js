import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      
      // Save theme preference
      localStorage.setItem('theme', theme);
    }
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    isLoaded,
  };

  if (!isLoaded) {
    return null; // Prevent flash of wrong theme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
