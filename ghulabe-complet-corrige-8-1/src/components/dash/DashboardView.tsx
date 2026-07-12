import React, { useState, useEffect, useCallback } from 'react';
import { Language, User, Domain, Alert, TabType } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_ALERTS } from '../../data/mockData';
import { GhulabeBackend } from '../../services/apiClient';
import { 
  Globe, Bell, ArrowUpRight, Plus, 
  CheckCircle2, AlertTriangle, AlertOctagon, Smartphone, Mail, Zap
} from 'lucide-react';

interface DashboardViewProps {
  lang: Language;
  currentUser: User;
  accessToken?: string;
  domains: Domain[];
  onAddDomain: (url: string) => void;
  setActiveTab: (tab: TabType) => void;
  onSelectPlan: (plan: 'gratuit' | 'gardien' | 'pentest_premium') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  currentUser,
  accessToken,
  domains,
  onAddDomain,
  setActiveTab,
  onSelectPlan
}) => {
  const t = getT(lang);
  const [newDomainUrl, setNewDomainUrl] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [realDomains, setRealDomains] = useState<Domain[]>(domains);
  const [realScansCount, setRealScansCount] = useState<number>(4);

  useEffect(() => {
    setRealDomains(domains);
  }, [domains]);

  const fetchDashboard = useCallback(() => {
    if (!currentUser?.id || !accessToken) return;

    GhulabeBackend.getDashboardData(accessToken).then((result) => {
      if (!result) return;
      if (result.domains.length > 0) setRealDomains(result.domains as Domain[]);
      if (result.alerts.length > 0) setAlerts(result.alerts as Alert[]);
      setRealScansCount(result.scansCount || 4);
    });
  }, [currentUser, accessToken]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainUrl || !newDomainUrl.includes('.')) return;
    if (!legalAccepted) {
      setAddError(lang === 'fr'
        ? "Vous devez confirmer disposer des droits d'administrateur sur ce domaine."
        : "You must confirm you have admin rights on this domain.");
      return;
    }

    if (accessToken) {
      setIsAddingDomain(true);
      setAddError(null);
      try {
        await GhulabeBackend.startScan(newDomainUrl, legalAccepted, accessToken);
        fetchDashboard();
        setNewDomainUrl('');
        setLegalAccepted(false);
        setShowAddModal(false);
      } catch (err: any) {
        setAddError(err.message || (lang === 'fr' ? "Erreur lors de l'ajout du domaine." : "Error adding domain."));
      } finally {
        setIsAddingDomain(false);
      }
      return;
    }

    onAddDomain(newDomainUrl);
    setNewDomainUrl('');
    setLegalAccepted(false);
    setShowAddModal(false);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-12">
      
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#00FF88] flex items-center justify-center text-[#0A0A0F] font-display font-black text-2xl">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              {t.dashTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
              {currentUser.name} • Plan Actuel : <strong className="text-[#00FF88] uppercase">{currentUser.plan}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00FF88]" />
            <span>{t.addDomain}</span>
          </button>

          {currentUser.plan === 'gratuit' && (
            <button
              onClick={() => onSelectPlan('gardien')}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-sm uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#0A0A0F]" />
              <span>Passer au Gardien (5k FCFA)</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0066FF]" />
              <span>{t.domainsList} ({realDomains.length})</span>
            </h2>
            <span className="text-xs font-mono text-gray-400">Scan externe automatisé</span>
          </div>

          <div className="space-y-4">
            {realDomains.map((dom) => (
