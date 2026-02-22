import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type ModeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ModeContext = createContext<ModeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Apply class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => useContext(ModeContext);
