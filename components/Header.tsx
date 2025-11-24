import React from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface ShopInfo {
    name: string;
    hotline: string;
    zalo: string;
}

interface HeaderProps {
    shopInfo: ShopInfo | null;
    onOpenShopInfoModal: () => void;
    onOpenApiKeyModal: () => void;
    gradientStyle: React.CSSProperties;
    onMinimize: () => void;
    onCloseApp: () => void;
    onZoom: (direction: 'in' | 'out' | 'reset') => void;
    zoomLevel: number;
    isVisible: boolean;
    onLogout: () => void;
    currentLanguage: string;
    onLanguageChange: (languageCode: string) => void;
    t: (key: any) => string;
}

export const Header: React.FC<HeaderProps> = ({ shopInfo, onOpenShopInfoModal, onOpenApiKeyModal, onMinimize, onCloseApp, onZoom, zoomLevel, isVisible, onLogout, currentLanguage, onLanguageChange, t }) => {
  return (
    <header className={`w-full bg-[#1a0000] sticky top-0 z-10 flex flex-wrap items-center justify-between gap-y-2 p-2 px-4 border-b border-gray-800 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      
      {/* Branding Section - Added */}
      <div className="flex items-center gap-2 mr-2 sm:mr-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-600 to-amber-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold border border-amber-500/30">
          <span className="text-xs sm:text-sm">FS</span>
        </div>
        <span className="hidden md:block text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200 tracking-tight">
          FashionStudio AI
        </span>
      </div>

      <div className="flex-1 flex flex-wrap items-center justify-end sm:justify-start gap-2 text-sm">
        <button
          onClick={onOpenApiKeyModal}
          className="bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg shadow-md hover:bg-red-700 transition-colors text-xs sm:text-sm"
          aria-label={t('loadApiKey')}
        >
          {t('loadApiKey')}
        </button>
        <button 
            onClick={onOpenShopInfoModal} 
            title={shopInfo?.name ? t('updateShopInfo') : t('setupShopInfo')} 
            className="flex items-center justify-center gap-1.5 font-bold text-white bg-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors shadow-md text-xs sm:text-sm max-w-[120px] sm:max-w-none truncate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
          </svg>
          {shopInfo?.name ? (
            <span className="truncate">{shopInfo.name}</span>
          ) : (
            <>
              <span className="sm:hidden">{t('setupShopInfoShort')}</span>
              <span className="hidden sm:inline">{t('setupShopInfo')}</span>
            </>
          )}
        </button>
        <a 
            href="https://zalo.me/g/prjycm243" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md text-xs sm:text-sm"
        >
            {t('joinZaloGroup')}
        </a>
        <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
      </div>

      <div className="hidden lg:flex items-center gap-2 sm:gap-4 ml-auto">
        <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-full px-2 py-0.5">
            <button onClick={() => onZoom('out')} disabled={zoomLevel <= 0.8} className="text-gray-300 hover:text-white disabled:opacity-50" title={t('zoomOut')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
            </button>
            <span onClick={() => onZoom('reset')} className="text-xs font-semibold text-gray-200 cursor-pointer tabular-nums w-10 text-center" title={t('resetZoom')}>{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => onZoom('in')} disabled={zoomLevel >= 1.5} className="text-gray-300 hover:text-white disabled:opacity-50" title={t('zoomIn')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
        </div>
        <a href="https://zalo.me/0988771339" target="_blank" rel="noopener noreferrer" className="hidden xl:block font-semibold text-white hover:text-cyan-400 transition-colors duration-200 text-sm">{t('contactAuthor')}</a>
         <button
          onClick={onLogout}
          className="text-gray-400 hover:text-white"
          aria-label={t('logout')}
          title={t('logout')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};