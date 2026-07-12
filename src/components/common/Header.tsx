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
    { id: 'home', label: t.nav.home, icon: <Shield
