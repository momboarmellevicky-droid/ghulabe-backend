import React, { useState } from 'react';
import { Developer, Language, Mission } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_DEVELOPERS, MOCK_MISSIONS } from '../../data/mockData';
import { AfricaMap } from './AfricaMap';
import { QCMTestView } from './QCMTestView';
import { MissionRequestModal } from './MissionRequestModal';
import { MissionChatModal } from './MissionChatModal';
import { 
  UserCheck, Search, MapPin, Award, ExternalLink, 
  ArrowRight, CheckCircle2, Eye, 
  CreditCard, Smartphone, ShieldAlert, Briefcase
} from 'lucide-react';

interface DevsPortalViewProps {
  lang: Language;
  initialMode?: 'find' | 'become';
}

export const DevsPortalView: React.FC<DevsPortalViewProps> = ({
  lang,
  initialMode = 'find'
}) => {
  const t = getT(lang);
  const [activeTab, setActiveTab] = useState<'find' | 'become'>(initialMode);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpeciality, setFilterSpeciality] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedDevForMission, setSelectedDevForMission] = useState<Developer | null>(null);
  const [activeChatMission, setActiveChatMission] = useState<Mission | null>(null);

  // 4 Sequential Recruitment Steps state
  const [recruitStep, setRecruitStep] = useState<1 | 2 | 3 | 4 | 'completed'>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: 'Gabon',
    city: 'Libreville',
    speciality: 'AppSec' as any,
    languages: ['Français', 'Anglais'],
    rateFcfa: 35000,
    experienceYears: 5,
    portfolioUrl: '',
    bio: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'airtel' | 'moov' | 'card'>('airtel');
  const [isVerifyingSmileId, setIsVerifyingSmileId] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(false);
  const [livenessActionDone, setLivenessActionDone] = useState(false);

  // Filter developers
  const filteredDevs = MOCK_DEVELOPERS.filter(dev => {
    if (filterSpeciality !== 'all' && dev.speciality !== filterSpeciality) return false;
    if (selectedCountry !== 'all' && dev.country !== selectedCountry) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return dev.name.toLowerCase().includes(q) || dev.city.toLowerCase().includes(q) || dev.bio.toLowerCase().includes(q);
    }
    return true;
  });

  // Badge UI renderer
  const renderBadge = (badge: Developer['badge_level']) => {
    if (badge === 'GHULABE RECRUIT') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D1B2A] border border-[#0066FF] text-[11px] text-[#80C4FF] font-mono">
          <Eye className="w-3 h-3 text-[#0066FF]" />
          <span>GHULABE RECRUIT (En validation)</span>
        </div>
      );
    }
    if (badge === 'GHULABE CERTIFIED') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/50 text-[11px] text-[#00FF88] font-mono font-bold">
          <CheckCircle2 className="w-3 h-3 text-[#00FF88]" />
          <span>GHULABE CERTIFIED (Note ≥ 70%)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/50 text-[11px] text-[#FFB800] font-mono font-bold">
        <Award className="w-3 h-3 text-[#FFB800]" />
        <span>GHULABE EXPERT (≥ 10 missions, ★ 4.9)</span>
      </div>
    );
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.portfolioUrl || !formData.bio) {
      alert(lang === 'fr' ? "Veuillez remplir tous les champs obligatoires du formulaire." : "Please fill in all mandatory fields.");
      return;
    }
    setRecruitStep(2);
  };

  const handleStep2Pay = () => {
    alert(lang === 'fr' 
      ? "✅ Paiement de 5 000 FCFA confirmé via " + paymentMethod.toUpperCase() + ".\nAccès à l'Étape 3 (Smile Identity Liveness) débloqué."
      : "✅ 5,000 FCFA payment confirmed.\nAccess to Step 3 unlocked."
    );
    setRecruitStep(3);
  };

  const handleStartSmileVerification = () => {
    if (!uploadedDoc || !livenessActionDone) {
      alert(lang === 'fr' 
        ? "Veuillez joindre votre pièce d'identité et effectuer la preuve de vie (clignement des yeux / rotation)."
        : "Please upload ID and perform liveness action."
      );
      return;
    }
    setIsVerifyingSmileId(true);

    setTimeout(() => {
      setIsVerifyingSmileId(false);
      alert(lang === 'fr'
        ? "✅ VÉRIFICATION SMILE IDENTITY RÉUSSIE EN 30s.\n\nBiométrie liveness confirmée. Accès au Test Technique QCM débloqué !"
        : "✅ SMILE IDENTITY VERIFICATION SUCCESSFUL.\n\nLiveness confirmed. Access to Technical QCM Test unlocked!"
      );
      setRecruitStep(4);
    }, 2500);
  };

  const handleFinishQcmTest = (_scorePct: number, passed: boolean) => {
    if (passed) {
      setRecruitStep('completed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-12">
      
      {/* Top Header & Portal Toggle */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/40 text-center relative">
        <span className="px-3 py-1 rounded-full bg-[#0066FF]/20 text-[#0066FF] font-mono text-xs font-bold uppercase tracking-widest">
          ghulabe.com/dev • Réseau Panafricain de Cybersécurité
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-black text-white mt-2">
          {t.devsTitle}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl mx-auto font-sans">
          {t.devsSub}
        </p>

        {/* Tab switcher */}
        <div className="flex justify-center mt-4">
          <div className="flex bg-[#0D1B2A] p-1.5 rounded-2xl border border-white/10 font-display font-bold text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('find')}
              className={`px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'find'
                  ? 'bg-[#0066FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.6)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t.tabFindDev}</span>
            </button>

            <button
              onClick={() => setActiveTab('become')}
              className={`px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'become'
                  ? 'bg-[#00FF88] text-[#0A0A0F] shadow-[0_0_20px_rgba(0,255,136,0.6)] font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{t.tabBecomeDev}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: TROUVER UN DÉVELOPPEUR CERTIFIÉ */}
      {activeTab === 'find' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          
          {/* Interactive Africa Map */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0066FF]" />
                  <span>{t.mapTitle}</span>
                </h2>
                <p className="text-xs text-gray-400">Cliquez sur un point lumineux (Libreville, Douala, Dakar, Accra, Lagos, Casablanca, Nairobi, Harare) pour filtrer par ville.</p>
              </div>
              <button
                onClick={() => setSelectedCountry('all')}
                className="text-xs font-mono text-[#0066FF] hover:underline cursor-pointer"
              >
                Réinitialiser filtre pays
              </button>
            </div>

            <AfricaMap
              developers={MOCK_DEVELOPERS}
              selectedCountry={selectedCountry === 'all' ? undefined : selectedCountry}
              onSelectDeveloper={(dev) => {
                setSelectedCountry(dev.country);
              }}
            />
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? "Rechercher un expert par nom, ville, spécialité..." : "Search expert by name, city..."}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={filterSpeciality}
                onChange={(e) => setFilterSpeciality(e.target.value)}
                className="p-3 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#0066FF]"
              >
                <option value="all">Toutes Spécialités</option>
                <option value="AppSec">AppSec</option>
                <option value="DevSecOps">DevSecOps</option>
                <option value="Pentest">Pentest</option>
                <option value="Network Security">Network Security</option>
              </select>

              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="p-3 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#0066FF]"
              >
                <option value="all">Tous Pays Africains</option>
                <option value="Gabon">Gabon (Libreville)</option>
                <option value="Cameroun">Cameroun (Douala)</option>
                <option value="Sénégal">Sénégal (Dakar)</option>
                <option value="Ghana">Ghana (Accra)</option>
                <option value="Nigeria">Nigeria (Lagos)</option>
                <option value="Maroc">Maroc (Casablanca)</option>
                <option value="Kenya">Kenya (Nairobi)</option>
                <option value="Zimbabwe">Zimbabwe (Harare)</option>
              </select>
            </div>
          </div>

          {/* Developers Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevs.map((dev) => (
              <div
                key={dev.id}
                className="glass-card rounded-2xl p-6 border border-white/10 hover:border-[#0066FF] transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0D1B2A] border border-[#0066FF]/40 flex items-center justify-center font-display font-extrabold text-lg text-[#00FF88]">
                        {dev.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white text-base">
                          {dev.name}
                        </h3>
                        <p className="text-xs font-mono text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#0066FF]" />
                          <span>{dev.city}, {dev.country}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded bg-[#0066FF]/20 text-[#80C4FF] font-mono text-[10px] uppercase font-bold shrink-0">
                      {dev.speciality}
                    </span>
                  </div>

                  {/* Badge & Rating */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                    {renderBadge(dev.badge_level)}
                    <div className="flex items-center gap-1 font-mono text-xs text-[#FFB800] font-bold">
                      <span>★</span>
                      <span>{dev.rating.toFixed(1)}/5</span>
                      <span className="text-gray-500 font-normal">({dev.missions_completed} missions)</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-3">
                    {dev.bio}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono bg-[#0A0A0F] p-2.5 rounded-xl border border-white/5">
                    <span className="text-gray-400">Tarif horaire :</span>
                    <span className="text-[#00FF88] font-bold">{dev.rate_fcfa.toLocaleString()} FCFA/h</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedDevForMission(dev)}
                    className="flex-1 py-3 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] cursor-pointer"
                  >
                    {t.contactDev}
                  </button>

                  <a
                    href={dev.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0D1B2A] hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                    title="Voir Portfolio / LinkedIn"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Active Missions simulation shortcut */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#00FF88]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <span>💬 Missions en cours & Messagerie Privée</span>
                <span className="px-2 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono font-bold">Simulateur Live</span>
              </h3>
              <span className="text-xs font-mono text-gray-400">Commission Ghulabe automatique : 15%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_MISSIONS.map(ms => (
                <div key={ms.id} className="p-4 rounded-2xl bg-[#0A0A0F] border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-[#00FF88]">{ms.client_name} ➔ {ms.developer_name}</span>
                    <p className="text-sm font-bold text-white mt-0.5 truncate max-w-sm">{ms.url} • {ms.urgency}</p>
                    <p className="text-xs text-gray-400 font-mono">{ms.budget_fcfa.toLocaleString()} FCFA net/brut</p>
                  </div>
                  <button
                    onClick={() => setActiveChatMission(ms)}
                    className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-mono text-xs font-bold shrink-0 cursor-pointer shadow-lg"
                  >
                    Ouvrir Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEVENIR DÉVELOPPEUR CERTIFIÉ (RECRUTEMENT SÉQUENTIEL STRICT EN 4 ÉTAPES) */}
      {activeTab === 'become' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-4xl mx-auto">
          
          {/* Step Indicator Top Bar */}
          <div className="glass-card p-6 rounded-3xl border border-[#00FF88]/40 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white">
                {t.recruitmentTitle}
              </h2>
              <span className="text-xs font-mono text-[#FF2D2D] font-bold uppercase">
                {t.recruitmentSub}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              {[
                { s: 1, title: "Formulaire", sub: "ghulabe.com/dev/apply" },
                { s: 2, title: "Paiement", sub: "5 000 FCFA non remboursable" },
                { s: 3, title: "Smile Identity", sub: "CNI + Liveness check 30s" },
                { s: 4, title: "Test QCM", sub: "30 questions / 45s / Webcam" }
              ].map((item) => {
                const isCurrent = recruitStep === item.s;
                const isDone = typeof recruitStep === 'number' ? recruitStep > item.s : true;

                return (
                  <div
                    key={item.s}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent ? 'bg-[#0066FF] text-white border-white shadow-[0_0_15px_rgba(0,102,255,0.6)] font-bold' :
                      isDone ? 'bg-[#0D1B2A] text-[#00FF88] border-[#00FF88]/40' : 'bg-[#0A0A0F] text-gray-600 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span>[{item.s}]</span>}
                      <span className="font-display font-bold truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] opacity-75 block mt-0.5 truncate">{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ÉTAPE 1 : FORMULAIRE */}
          {recruitStep === 1 && (
            <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#0066FF] shadow-[0_0_40px_rgba(0,102,255,0.2)] space-y-8">
              <div className="border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-[#0066FF] font-bold">ÉTAPE 1 / 4 (ghulabe.com/dev/apply)</span>
                <h3 className="text-2xl font-display font-extrabold text-white mt-1">
                  Formulaire d'Inscription Candidat
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Votre nom complet doit être strictement identique à votre pièce d'identité CNI ou Passeport.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6 text-left text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Nom complet (identique CNI/Passeport) *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
             
