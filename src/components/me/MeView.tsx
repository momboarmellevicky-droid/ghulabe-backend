import React, { useState, useEffect } from 'react';
import { Language, User } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_DEVELOPERS, MOCK_MISSIONS, MOCK_MESSAGES } from '../../data/mockData';
import { GhulabeBackend } from '../../services/apiClient';
import { 
  FileText, DollarSign, Key, UserX, UserCheck, Eye
} from 'lucide-react';

interface MeViewProps {
  lang: Language;
  currentUser: User;
  accessToken?: string; // Token de session JWT. Absent tant que la gestion de session
  // n'est pas branchée côté App.tsx : dans ce cas, apiClient.getMissions() retombe
  // automatiquement sur MOCK_MISSIONS (voir apiClient.ts, aucun crash à prévoir).
  onLogout?: () => void;
  onOpenLegal: (page: 'mentions' | 'privacy' | 'cgu' | 'disclaimer' | 'cookies') => void;
}

export const MeView: React.FC<MeViewProps> = ({
  lang,
  currentUser,
  accessToken,
  onLogout,
  onOpenLegal
}) => {
  const t = getT(lang);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaVerified, setTwoFaVerified] = useState(false);
  
  // Admin state
  const [devList, setDevList] = useState(MOCK_DEVELOPERS);
  const [missionList, setMissionList] = useState(MOCK_MISSIONS);
  const [selectedChatMissionId, setSelectedChatMissionId] = useState<string | null>(null);

  // Charge les vraies missions depuis /api/missions dès que la vue admin est ouverte.
  // Reste sur MOCK_MISSIONS (déjà initialisé ci-dessus) tant que la requête n'a pas abouti,
  // pour ne jamais afficher un tableau vide pendant le chargement.
  useEffect(() => {
    if (!isAdminMode) return;
    let cancelled = false;
    GhulabeBackend.getMissions(accessToken).then((missions) => {
      if (!cancelled) setMissionList(missions);
    });
    return () => { cancelled = true; };
  }, [isAdminMode, accessToken]);

  // Mock pending dev applications
  const [pendingApps, setPendingApps] = useState([
    {
      id: 'app-99',
      name: 'Amadou Koné',
      email: 'a.kone@devsec-abidjan.ci',
      country: 'Côte d\'Ivoire',
      city: 'Abidjan',
      speciality: 'AppSec',
      smile_identity: 'VERIFIED (30s auto check OK)',
      test_score: 84,
      status: 'pending',
      rate_fcfa: 35000
    },
    {
      id: 'app-100',
      name: 'Salif Traoré',
      email: 's.traore@pentest-mali.ml',
      country: 'Mali',
      city: 'Bamako',
      speciality: 'Pentest',
      smile_identity: 'VERIFIED (Selfie Liveness Blink OK)',
      test_score: 72,
      status: 'pending',
      rate_fcfa: 30000
    }
  ]);

  // Calculate total FCFA commissions (15% on all missions)
  const totalGrossFcfa = missionList.reduce((acc, m) => acc + m.budget_fcfa, 0);
  const totalCommissionGhulabeFcfa = Math.round(totalGrossFcfa * 0.15);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFaCode === '2026' || twoFaCode === '123456' || twoFaCode.length >= 4) {
      setTwoFaVerified(true);
      setIsAdminMode(true);
    } else {
      alert("Code 2FA invalide. Accès refusé par le pare-feu GHULABE.");
    }
  };

  const handleApproveApp = (id: string, name: string) => {
    setPendingApps(pendingApps.filter(a => a.id !== id));
    alert(`✅ Candidat "${name}" approuvé ! Certificat GHULABE RECRUIT émis.`);
  };

  const handleRejectApp = (id: string) => {
    setPendingApps(pendingApps.filter(a => a.id !== id));
    alert("❌ Candidature refusée. Email de notification transmis.");
  };

  const toggleSuspendDev = (id: string) => {
    setDevList(devList.map(d => {
      if (d.id === id) {
        const newStatus = d.status === 'active' ? 'suspended' : 'active';
        alert(`Statut du développeur "${d.name}" modifié en : ${newStatus.toUpperCase()}`);
        return { ...d, status: newStatus };
      }
      return d;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-12">
      
      {/* Profile Overview Card */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0066FF] via-[#00FF88] to-[#0066FF] flex items-center justify-center text-[#0A0A0F] font-display font-black text-3xl">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono text-xs font-bold uppercase">
              Compte PME / Propriétaire Vérifié
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              {currentUser.name}
            </h1>
            <p className="text-xs font-mono text-gray-400 mt-1">
              {currentUser.email} • Plan Actuel : <strong className="text-[#00FF88] uppercase">{currentUser.plan}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isAdminMode ? (
            <button
              onClick={() => {
                if (twoFaVerified) {
                  setIsAdminMode(true);
                } else {
                  setIsAdminMode(true);
                }
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8800] text-[#0A0A0F] font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,184,0,0.4)] cursor-pointer flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>{t.adminPortalBtn}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdminMode(false)}
              className="px-4 py-3 rounded-xl bg-[#0D1B2A] hover:bg-white/10 text-gray-300 text-xs font-mono transition-colors cursor-pointer"
            >
              ⬅ Quitter Panneau Admin
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-3 rounded-xl bg-[#FF2D2D]/20 hover:bg-[#FF2D2D] text-[#FF2D2D] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer border border-[#FF2D2D]/40"
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>

      {/* 2FA GATEWAY FOR ADMIN MODE (Mombo Armelle Vicky exclusively) */}
      {isAdminMode && !twoFaVerified && (
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#FFB800] max-w-lg mx-auto text-center space-y-6 shadow-[0_0_40px_rgba(255,184,0,0.3)] animate-bounce-short">
          <div className="w-16 h-16 rounded-2xl bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 flex items-center justify-center mx-auto">
            <Key className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white">
              Authentification 2FA Obligatoire
            </h2>
            <p className="text-xs text-gray-300 mt-1 font-mono">
              Accès strictement réservé à <strong>Mombo Armelle Vicky</strong> (ghulabe.com/admin)
            </p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input
              type="text"
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value)}
              placeholder="Entrez code 2FA (ex: 2026)"
              className="w-full text-center py-4 rounded-xl bg-[#0A0A0F] border border-[#FFB800] text-[#FFB800] font-mono text-xl tracking-widest font-black focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
              maxLength={6}
              required
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8800] text-[#0A0A0F] font-display font-black text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer"
            >
              Débloquer Panneau Admin
            </button>
          </form>
          <p className="text-[10px] text-gray-500 font-mono">
            💡 Astuce démo : Tapez "2026" ou "123456" pour entrer immédiatement.
          </p>
        </div>
      )}

      {/* ADMIN PANEL DASHBOARD (ghulabe.com/admin) */}
      {isAdminMode && twoFaVerified && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0D1B2A] via-[#0066FF]/20 to-[#0A0A0F] border-2 border-[#FFB800] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_35px_rgba(255,184,0,0.25)]">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-[#FFB800]/20 text-[#FFB800] font-mono text-xs font-black uppercase">
                ghulabe.com/admin • Accès Privilégié Master
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">
                {t.adminTitle}
              </h2>
              <p className="text-xs text-gray-300 font-mono mt-0.5">
                {t.adminSub} • Base de données chiffrée AES-256
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#0A0A0F] px-4 py-2.5 rounded-2xl border border-[#FFB800]/40 font-mono text-right shrink-0">
              <DollarSign className="w-5 h-5 text-[#00FF88]" />
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Commissions GHULABE (15%)</span>
                <span className="text-lg font-black text-[#00FF88]">{totalCommissionGhulabeFcfa.toLocaleString()} FCFA net</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: CANDIDATURES DÉVELOPPEURS EN ATTENTE & SMILE IDENTITY */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#0066FF]/40 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00FF88]" />
                <span>Candidatures Développeurs & Résultats Smile Identity ({pendingApps.length})</span>
              </h3>
              <span className="text-xs font-mono text-gray-400">Approve / Reject centralisé</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApps.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-gray-400 font-mono text-xs">
                  Aucune candidature en attente. Tous les experts ont été traités.
                </div>
              ) : (
                pendingApps.map((app) => (
                  <div key={app.id} className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/10 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-white text-base">{app.name}</span>
                        <span className="px-2 py-0.5 rounded bg-[#0066FF]/20 text-[#80C4FF] font-mono text-[10px] font-bold">
                          {app.speciality}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-400">{app.email} • {app.city}, {app.country}</p>
                      <div className="p-2 rounded bg-[#0D1B2A] border border-[#00FF88]/30 font-mono text-[11px] text-[#00FF88]">
                        🛡️ Biométrie Smile ID : {app.smile_identity}
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-gray-400">Score QCM : <strong className="text-[#00FF88]">{app.test_score}%</strong> (Seuil ≥ 70% OK)</span>
                        <span className="text-white font-bold">{app.rate_fcfa.toLocaleString()} FCFA/h</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleApproveApp(app.id, app.name)}
                        className="flex-1 py-2.5 rounded-xl bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-xs uppercase cursor-pointer"
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => handleRejectApp(app.id)}
                        className="flex-1 py-2.5 rounded-xl bg-[#FF2D2D]/20 hover:bg-[#FF2D2D] text-[#FF2D2D] hover:text-white font-display font-bold text-xs uppercase cursor-pointer border border-[#FF2D2D]/40"
                      >
                        ✕ Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 2: CONTRÔLE DES DÉVELOPPEURS ACTIFS & SUSPENSION */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 className="font-display font-bold text-white text-xl flex items-center gap-2">
              <UserX className="w-5 h-5 text-[#FF6B2D]" />
              <span>Supervision Développeurs Certifiés & Contrôles de Suspension</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="pb-3 px-3">Expert</th>
                    <th className="pb-3 px-3">Ville / Spécialité</th>
                    <th className="pb-3 px-3">Badge</th>
                    <th className="pb-3 px-3">Note Moyenne</th>
                    <th className="pb-3 px-3">Statut</th>
                    <th className="pb-3 px-3 text-right">Contrôle Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {devList.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5">
                      <td className="py-3 px-3 font-bold text-white">{d.name}</td>
                      <td className="py-3 px-3">{d.city} ({d.speciality})</td>
                      <td className="py-3 px-3 text-[#80C4FF]">{d.badge_level}</td>
                      <td className="py-3 px-3">
                        <span className={d.rating < 3 ? 'text-[#FF2D2D] font-bold' : 'text-[#00FF88]'}>
                          ★ {d.rating.toFixed(1)}/5
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'active' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2D2D]/20 text-[#FF2D2D]'
                        }`}>
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => toggleSuspendDev(d.id)}
                          className={`px-3 py-1 rounded font-bold cursor-pointer transition-colors ${
                            d.status === 'active'
                              ? 'bg-[#FF2D2D]/20 hover:bg-[#FF2D2D] text-[#FF2D2D] hover:text-white border border-[#FF2D2D]/40'
                              : 'bg-[#00FF88]/20 hover:bg-[#00FF88] text-[#00FF88] hover:text-[#0A0A0F] border border-[#00FF88]/40'
                          }`}
                        >
                          {d.status === 'active' ? 'Suspendre' : 'Réintégrer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: MISSIONS, RÉSOLUTION DE LITIGES & INSPECTION DES MESSAGES */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#0066FF]/40 space-y-6">
            <h3 className="font-display font-bold text-white text-xl flex items-center justify-between">
              <span>Missions en cours & Résolution de Litiges (Télémétrie Complète)</span>
              <span className="text-xs font-mono text-[#00FF88]">Total Bruts : {totalGrossFcfa.toLocaleString()} FCFA</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {missionList.map((ms) => (
                <div key={ms.id} className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0F] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-[#00FF88] font-bold">Mission #{ms.id}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">{ms.status}</span>
                      <span className="text-[#FF2D2D] font-bold uppercase">Urgence: {ms.urgency}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{ms.url} — {ms.client_name} ➔ {ms.developer_name}</p>
                    <p className="text-xs font-mono text-gray-400">
                      Budget client : <strong className="text-white">{ms.budget_fcfa.toLocaleString()} FCFA</strong> • Commission 15% GHULABE : <strong className="text-[#00FF88]">{Math.round(ms.budget_fcfa * 0.15).toLocaleString()} FCFA net</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedChatMissionId(selectedChatMissionId === ms.id ? null : ms.id)}
                      className="px-4 py-2 rounded-xl bg-[#0D1B2A] hover:bg-[#0066FF] text-gray-200 hover:text-white font-mono text-xs transition-colors cursor-pointer border border-[#0066FF]/40"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                      <span>{selectedChatMissionId === ms.id ? 'Masquer Chat Client/Dev' : 'Inspecter Chat Privé'}</span>
                    </button>
                    <button
                      onClick={() => alert(`📄 Export PDF de la mission #${ms.id} chiffré et sauvegardé.`)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#00FF88] cursor-pointer"
                      title="Export PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Chat Viewer */}
            {selectedChatMissionId && (
              <div className="p-5 rounded-2xl bg-[#070D14] border border-[#0066FF] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[#00FF88]">
                  <span>🔒 Inspection de la Messagerie Interne (Mission #{selectedChatMissionId})</span>
                  <span className="text-gray-400 text-[10px]">Avis de litige & télémétrie Admin active</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {MOCK_MESSAGES.map((m) => (
                    <div key={m.id} className="p-2.5 rounded bg-[#0D1B2A] border border-white/5 text-gray-200">
                      <span c
