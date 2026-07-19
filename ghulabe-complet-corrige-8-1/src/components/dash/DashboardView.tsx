import React, { useState, useEffect } from 'react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [realDomains, setRealDomains] = useState<Domain[]>(domains);
  const [realScansCount, setRealScansCount] = useState<number>(4);

  useEffect(() => {
    setRealDomains(domains);
  }, [domains]);

  useEffect(() => {
    if (!currentUser?.id || !accessToken) return;

    GhulabeBackend.getDashboardData(accessToken).then((result) => {
      if (!result) return;
      if (result.domains.length > 0) setRealDomains(result.domains as Domain[]);
      if (result.alerts.length > 0) setAlerts(result.alerts as Alert[]);
      setRealScansCount(result.scansCount || 4);
    });
  }, [currentUser, accessToken]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainUrl || !newDomainUrl.includes('.')) return;
    onAddDomain(newDomainUrl);
    setNewDomainUrl('');
    setShowAddModal(false);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-12">
      
      {/* Dashboard Top Overview */}
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

      {/* Grid: Monitored Domains & Active SMS/Email Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left 2 Cols: Domains List */}
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
              <div
                key={dom.id}
                className="glass-card p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-[#0066FF]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white">
                    <span>{dom.url}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      dom.status === 'safe' ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40' :
                      dom.status === 'warning' ? 'bg-[#FF6B2D]/15 text-[#FF6B2D] border-[#FF6B2D]/40' : 'bg-[#FF2D2D]/15 text-[#FF2D2D] border-[#FF2D2D]/40'
                    }`}>
                      {dom.status === 'safe' ? '🟢 Sécurisé' : dom.status === 'warning' ? '🟠 Vulnérable' : '🔴 Critique'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400">
                    Dernier scan : <strong className="text-gray-200">{dom.last_scan || 'Aujourd\'hui'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="text-right font-mono">
                    <span className="text-xs text-gray-400 block">Score</span>
                    <span className={`text-xl font-display font-extrabold ${
                      (dom.score || 0) >= 8 ? 'text-[#00FF88]' : (dom.score || 0) >= 5 ? 'text-[#FF6B2D]' : 'text-[#FF2D2D]'
                    }`}>
                      {dom.score ?? 'N/A'}/10
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab('scan')}
                    className="px-4 py-2 rounded-lg bg-[#0D1B2A] hover:bg-[#0066FF] text-gray-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#0066FF]/40"
                  >
                    <span>Inspecter Rapport</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {dom.certified && (
                  <div className="w-full mt-3 pt-3 border-t border-[#00FF88]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://ghulabe-backend-1.onrender.com/api/public/certification/${dom.id}/badge.svg`}
                        alt="Badge GHULABE Certifié"
                        className="h-10"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const embedCode = `<a href="https://ghulabe.com/verify/${dom.id}" target="_blank" rel="noopener"><img src="https://ghulabe-backend-1.onrender.com/api/public/certification/${dom.id}/badge.svg" alt="Entreprise auditée GHULABE" /></a>`;
                        navigator.clipboard.writeText(embedCode);
                        alert(lang === 'fr' ? '✅ Code du badge copié ! Collez-le dans le HTML de votre site.' : '✅ Badge code copied! Paste it into your site HTML.');
                      }}
                      className="px-3 py-2 rounded-lg bg-[#00FF88]/15 hover:bg-[#00FF88]/25 text-[#00FF88] font-mono text-xs border border-[#00FF88]/40 cursor-pointer"
                    >
                      Copier le code d'intégration
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="glass-card p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-xs font-mono text-gray-400 block">Total de scans réalisés</span>
              <span className="text-2xl font-display font-bold text-[#00FF88] mt-1 block">{realScansCount}</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-xs font-mono text-gray-400 block">Failles corrigées</span>
              <span className="text-2xl font-display font-bold text-[#0066FF] mt-1 block">14 CVE</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-xs font-mono text-gray-400 block">Hébergement cible</span>
              <span className="text-2xl font-display font-bold text-white mt-1 block">Render EU</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#FF6B2D]" />
              <span>{t.alertsTitle}</span>
            </h2>
            <div className="flex items-center gap-1 text-[10px] bg-[#0D1B2A] px-2 py-1 rounded text-[#00FF88] font-mono">
              <Smartphone className="w-3 h-3" />
              <Mail className="w-3 h-3" />
              <span>Actif</span>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl border border-white/5 text-center text-gray-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-[#00FF88] mx-auto mb-2 opacity-50" />
                {t.noAlerts}
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`glass-card p-4 rounded-2xl border transition-all ${
                    alt.is_read ? 'opacity-60 border-white/5 bg-[#0A0A0F]' :
                    alt.severity === 'critique' ? 'border-[#FF2D2D]/60 bg-[#FF2D2D]/10 shadow-[0_0_15px_rgba(255,45,45,0.15)]' : 'border-[#FF6B2D]/60 bg-[#FF6B2D]/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {alt.severity === 'critique' ? (
                        <AlertOctagon className="w-5 h-5 text-[#FF2D2D]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#FF6B2D]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-white">{alt.domain_url}</span>
                        <span className="text-gray-400 text-[10px]">{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-200 font-sans leading-relaxed">
                        {lang === 'fr' ? alt.message_fr : alt.message_en}
                      </p>
                      {!alt.is_read && (
                        <button
                          onClick={() => markAlertAsRead(alt.id)}
                          className="mt-2 text-[10px] font-mono text-[#00FF88] hover:underline block cursor-pointer"
                        >
                          {lang === 'fr' ? "✓ Marquer comme traité et résolu" : "✓ Mark as resolved"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="glass-card p-6 rounded-2xl border border-[#0066FF]/40 bg-gradient-to-br from-[#0D1B2A] to-[#0A0A0F] space-y-3">
            <h3 className="font-display font-bold text-white text-sm">
              🛡️ Surveillance Gardien 24/7
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Pour 5 000 FCFA/mois, GHULABE vérifie votre site toutes les heures, vous alerte par SMS et stocke vos historiques d'audit bilingues.
            </p>
            <button
              onClick={() => onSelectPlan('gardien')}
              className="w-full py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase transition-all cursor-pointer"
            >
              Activer le Gardien maintenant
            </button>
          </div>
        </div>

      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card p-8 rounded-3xl max-w-md w-full border border-[#0066FF] shadow-[0_0_40px_rgba(0,102,255,0.3)] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-white">Ajouter un Domaine</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 font-sans">
              Entrez l'URL du domaine à auditer en continu. Vous devez disposer des droits d'administrateur.
            </p>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input
                type="text"
                value={newDomainUrl}
                onChange={(e) => setNewDomainUrl(e.target.value)}
                placeholder="ex: masociete-douala.cm"
                className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-sm focus:border-[#00FF88] focus:outline-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(0,102,255,0.5)]"
                >
                  Ajouter au scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
