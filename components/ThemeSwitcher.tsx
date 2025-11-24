import React, { useState, useEffect, useRef } from 'react';

export interface Theme {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
  secondaryTextColor: string;
  titleColor: string;
  headerTextColor: string;
}

interface ThemeSwitcherProps {
  themes: Theme[];
  activeThemeId: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ themes, activeThemeId, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  return (
    <div ref={switcherRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-48 justify-between p-2 bg-gray-800/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-lg shadow-lg text-white font-semibold transition-all duration-300"
      >
        <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full border border-white/20"
              style={{ background: activeTheme.gradient }}
            />
            <span>{activeTheme.name}</span>
        </div>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-48 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
          <ul className="max-h-60 overflow-y-auto">
            {themes.map(theme => (
              <li key={theme.id}>
                <button
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors duration-150 ${
                    activeThemeId === theme.id
                      ? 'bg-amber-600/30 text-amber-200'
                      : 'hover:bg-gray-700/50 text-white'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                    style={{ background: theme.gradient }}
                  />
                  <span>{theme.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};