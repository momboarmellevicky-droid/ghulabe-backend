import React from 'react';
import { TabType, Language } from '../../types';
import { getT } from '../../data/i18n';
import { Shield, Terminal, Globe, UserCheck, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  lang
}) => {
  const t = getT(lang);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.nav.home, icon: <Shield className="w-5 h-5" /> },
    { id: 'scan', label: t.nav.scan, icon: <Terminal className="w-5 h-5 text-[#00FF88]" /> },
    { id: 'dash', label: t.nav.dash, icon: <Globe className="w-5 h-5" /> },
    { id: 'devs', label: t.nav.devs, icon: <UserCheck className="w-5 h-5" /> },
    { id: 'me', label: t.nav.me, icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-2xl border-t border-[#0066FF]/40 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,102,255,0.25)]">
      <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-t from-[#0066FF]/30 to-transparent text-white border-t-2 border-[#0066FF] shadow-[0_0_15px_rgba(0,102,255,0.5)]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={isActive ? 'text-[#0066FF] transform scale-110' : ''}>
                {tab.icon}
              </div>
