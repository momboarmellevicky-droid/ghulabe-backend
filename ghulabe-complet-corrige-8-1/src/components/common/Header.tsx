import React from 'react';
import { Language, TabType, User } from '../../types';
import { getT } from '../../data/i18n';
import { Logo3DEye } from './Logo3DEye';
import { Shield, Globe, Terminal, UserCheck } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  currentUser
}) => {
  const t = getT(lang);

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.nav.home, icon: <Shield className="w-4 h-4" /> },
    { id: 'scan', label: t.nav.scan, icon: <Terminal className="w-4 h-4" /> },
    { id: 'dash', label: t.nav.dash, icon: <Globe className="w-4 h-4" /> },
    { id: 'devs', label: t.nav.devs, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'me', label: t.nav.me, icon: <Shield className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#0066FF]/25 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div onClick={() => setActiveTab('home')} className="cursor-pointer">
            <Logo3DEye size="md" showText={true} />
          </div>

          {/* Security & Host Badge Desktop */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1B2A] border border-[#0066FF]/40 text-xs text-gray-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
            <span>Render EU Host</span>
            <span className="text-[#0066FF]">•</span>
            <span>TLS 1.3 / AES-256</span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-[#0D1B2A]/60 p-1.5 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.6)] font-display font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'devs' && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 rounded font-mono">
                    CERT
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Bilingual FR/EN Switcher */}
          <div className="flex items-center bg-[#0D1B2A] rounded-lg p-1 border border-[#0066FF]/30 font-mono text-xs font-semibold select-none">
            <button
              onClick={() => setLang('fr')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                lang === 'fr'
                  ? 'bg-[#0066FF] text-white shadow-[0_0_8px_rgba(0,102,255,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#0066FF] text-white shadow-[0_0_8px_rgba(0,102,255,0.8)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Quick Scan CTA Button */}
          <button
            onClick={() => setActiveTab('scan')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#004CDA] hover:from-[#0052CC] hover:to-[#003B99] text-white font-display font-bold text-sm shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-[#80C4FF]/30"
          >
            <Terminal className="w-4 h-4 text-[#00FF88]" />
            <span>{t.quickScan}</span>
          </button>

          {/* User / Plan Pill */}
          <div
            onClick={() => setActiveTab('me')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D1B2A] hover:bg-[#152a42] border border-white/10 cursor-pointer transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00FF88] flex items-center justify-center text-xs font-bold text-[#0A0A0F]">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:inline text-xs font-mono uppercase text-[#00FF88]">
              {currentUser.plan}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};
