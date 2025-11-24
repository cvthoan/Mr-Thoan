import React, { useState, useEffect, useRef } from 'react';

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
];

interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLanguage, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const activeLanguage = languages.find(lang => lang.code === currentLanguage) || languages[1];

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

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div ref={switcherRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white font-semibold transition-colors duration-300 hover:border-amber-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
        </svg>

        <span>{activeLanguage.name}</span>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full min-w-[160px] bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20 animate-fade-in-up">
          <ul className="py-1">
            {languages.map(lang => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                    currentLanguage === lang.code
                      ? 'bg-amber-600/30 text-amber-200 font-bold'
                      : 'hover:bg-gray-700/50 text-white'
                  }`}
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
