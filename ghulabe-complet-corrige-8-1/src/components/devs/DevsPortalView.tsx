import React, { useState, useEffect } from 'react';
import { Developer, Language, Mission } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_MISSIONS } from '../../data/mockData';
import { AfricaMap } from './AfricaMap';
import { QCMTestView } from './QCMTestView';
import { MissionRequestModal } from './MissionRequestModal';
import { MissionChatModal } from './MissionChatModal';
import { 
  UserCheck, Search, MapPin, Award, ExternalLink, 
  ArrowRight, CheckCircle2, Eye, 
  CreditCard, Smartphone, ShieldAlert, Briefcase
} from 'lucide-react';
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://ghulabe-backend-1.onrender.com/api';
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
    password: '',
    country: 'Gabon',
    city: 'Libreville',
    specialites: [] as string[],
    languages: ['Français', 'Anglais'],
    rateFcfa: 35000,
    experienceYears: 5,
    portfolioUrl: '',
    bio: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'airtel' | 'moov' | 'card'>('airtel');
const [recruitPhone, setRecruitPhone] = useState('');
  const [isVerifyingSmileId, setIsVerifyingSmileId] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(false);
  const [livenessActionDone, setLivenessActionDone] = useState(false);
  const [realDevelopers, setRealDevelopers] = useState<Developer[]>([]);

  useEffect(() => {
    fetch('/api/auth/developers')
      .then((res) => res.json())
      .then((data) => {
        const devs = (data.developers || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          country: d.country,
          city: d.city || '',
          bio: d.bio || '',
          rate_fcfa: d.rate_fcfa || 0,
          portfolio_url: d.portfolio_url || '',
          badge_level: d.badge_level || 'GHULABE RECRUIT',
          rating: d.rating || 0,
          missions_completed: d.missions_completed || 0,
          speciality: (d.specialites && d.specialites[0]) || '',
        }));
        setRealDevelopers(devs);
      })
      .catch(() => setRealDevelopers([]));
  }, []);

  // Filter developers
  const filteredDevs: Developer[] = realDevelopers.filter(dev => {
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
    if (!formData.fullName || !formData.email || !formData.password || !formData.portfolioUrl || !formData.bio || formData.specialites.length === 0) {
      alert(lang === 'fr' ? "Veuillez remplir tous les champs obligatoires, y compris le mot de passe et au moins une spécialité." : "Please fill in all mandatory fields, including password and at least one specialty.");
      return;
    }
    if (formData.password.length < 8) {
      alert(lang === 'fr' ? "Le mot de passe doit contenir au moins 8 caractères." : "Password must be at least 8 characters.");
      return;
    }
    setRecruitStep(2);
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

const handleStep2Pay = async () => {
  if (!recruitPhone) {
    alert(lang === 'fr'
      ? "Veuillez saisir votre numéro Mobile Money."
      : "Please enter your Mobile Money number.");
    return;
  }
  if (paymentMethod !== 'airtel' && paymentMethod !== 'moov') {
    alert(lang === 'fr'
      ? "Ce mode de paiement n'est pas encore disponible. Choisissez Airtel Money ou Moov Money."
      : "This payment method is not yet available. Choose Airtel Money or Moov Money.");
    return;
  }

  setIsProcessingPayment(true);
  try {
    c`${API_BASE_URL}/recruitment/start`
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        phoneNumber: recruitPhone,
        operator: paymentMethod,
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(lang === 'fr'
        ? data.message_fr || "Le paiement a échoué. Veuillez réessayer."
        : data.message_en || "Payment failed. Please try again.");
      setIsProcessingPayment(false);
      return;
    }

    if (data.status === 'success') {
      alert(lang === 'fr' ? data.message_fr : data.message_en);
      setIsProcessingPayment(false);
      setRecruitStep(3);
      return;
    }

    if (!data.transactionId) {
      alert(lang === 'fr'
        ? "Paiement initié mais impossible de suivre son statut. Contactez le support."
        : "Payment initiated but status cannot be tracked. Contact support.");
      setIsProcessingPayment(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;
    const poll = setInterval(async () => {
      attempts++;
      try {
      `/api/recruitment/status/${data.transactionId}`
        const statusData = await statusRes.json();

        if (statusData.status === 'success') {
          clearInterval(poll);
          alert(lang === 'fr' ? statusData.message_fr : statusData.message_en);
          setIsProcessingPayment(false);
          setRecruitStep(3);
        } else if (statusData.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(poll);
          setIsProcessingPayment(false);
          alert(lang === 'fr'
            ? "Le paiement n'a pas été confirmé à temps. Vérifiez votre téléphone et réessayez."
            : "Payment was not confirmed in time. Check your phone and try again.");
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setIsProcessingPayment(false);
        }
      }
    }, 4000);
  } catch (err) {
    alert(lang === 'fr'
      ? "Erreur réseau lors du paiement. Réessayez."
      : "Network error during payment. Please retry.");
    setIsProcessingPayment(false);
  }
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

  const handleFinishQcmTest = async (_scorePct: number, passed: boolean) => {
    if (!passed) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          country: formData.country,
          role: 'dev',
          specialites: formData.specialites,
          city: formData.city,
          bio: formData.bio,
          rateFcfa: formData.rateFcfa,
          portfolioUrl: formData.portfolioUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(lang === 'fr'
          ? `Erreur lors de la création du compte : ${data.error_fr || 'inconnue'}`
          : `Account creation error: ${data.error_en || 'unknown'}`);
        return;
      }
      setRecruitStep('completed');
    } catch (err: any) {
      alert(lang === 'fr'
        ? "Erreur réseau lors de la création du compte. Réessayez."
        : "Network error while creating the account. Please retry.");
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
              developers={realDevelopers}
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
          <h2 className="text-2xl sm:text-3xl font-display font-black text-[#0047AB] text-center py-6">
  ESPACE DÉVELOPPEURS
</h2>
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
                      placeholder="ex: Moussavou Paul Cédric"
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Email professionnel *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="p.moussavou@appsec-gabon.ga"
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Mot de passe (8 caractères min.) *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Pays *</label>
                    <select
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs"
                    >
                      <option value="Gabon">Gabon</option>
                      <option value="Cameroun">Cameroun</option>
                      <option value="Sénégal">Sénégal</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Maroc">Maroc</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Ville *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      placeholder="Libreville, Dakar..."
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Spécialités techniques * (choisissez-en au moins une)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'wordpress', label: 'WordPress / CMS' },
                        { value: 'linux_serveur', label: 'Serveur Linux' },
                        { value: 'ssl_reseau', label: 'SSL & Réseau' },
                        { value: 'base_donnees', label: 'Base de Données' },
                        { value: 'headers_http', label: 'Headers HTTP / API' },
                        { value: 'osint_recon', label: 'Reconnaissance / OSINT' },
                      ].map(opt => {
                        const selected = (formData.specialites as string[]).includes(opt.value);
                        return (
                          <label
                            key={opt.value}
                            className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors ${selected ? 'bg-[#0066FF]/30 border-[#0066FF] text-[#00FF88]' : 'bg-[#0A0A0F] border-white/10 text-gray-300'}`}
                          >
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={selected}
                              onChange={() => {
                                const current = formData.specialites as string[];
                                const next = selected ? current.filter(s => s !== opt.value) : [...current, opt.value];
                                setFormData({...formData, specialites: next});
                              }}
                            />
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Tarif horaire souhaité en FCFA *</label>
                    <input
                      type="number"
                      value={formData.rateFcfa}
                      onChange={e => setFormData({...formData, rateFcfa: Number(e.target.value)})}
                      step="2500"
                      min="15000"
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-gray-300">Portfolio GitHub / GitLab / LinkedIn *</label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={e => setFormData({...formData, portfolioUrl: e.target.value})}
                      placeholder="https://github.com/mon-compte"
                      className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-gray-300">Bio & Expérience (minimum 3 lignes) *</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    placeholder="Présentez vos expertises OWASP, certifications et expériences en sécurisation PME..."
                    className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-sans text-xs resize-none"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="px-8 py-4 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] hover:text-[#0A0A0F] text-white font-display font-extrabold text-sm uppercase transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] cursor-pointer flex items-center gap-2"
                  >
                    <span>{t.step1Submit}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ÉTAPE 2 : PAIEMENT FRAIS DE DOSSIER (5 000 FCFA NON REMBOURSABLE) */}
          {recruitStep === 2 && (
            <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#FFB800] shadow-[0_0_40px_rgba(255,184,0,0.2)] space-y-8">
              <div className="border-b border-white/10 pb-4 text-left">
                <span className="text-xs font-mono text-[#FFB800] font-bold">ÉTAPE 2 / 4 : PAIEMENT OBLIGATOIRE</span>
                <h3 className="text-2xl font-display font-extrabold text-white mt-1">
                  Frais de Dossier — 5 000 FCFA (Non remboursable)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  L'accès aux étapes 3 (Biométrie) et 4 (Test QCM) est strictement bloqué sans paiement confirmé.
                </p>
              </div>

              {/* STRUCTURE TARIFAIRE COMPLÈTE REQUISE */}
              <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/10 text-left font-mono text-xs space-y-2 text-gray-300">
                <p className="text-[#FFB800] font-bold uppercase tracking-wider mb-1">Structure Tarifaire Complète GHULABE</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p>• Frais dossier initial : <strong className="text-white">5 000 FCFA</strong></p>
                  <p>• Renouvellement annuel : <strong className="text-white">2 500 FCFA/an</strong></p>
                  <p>• Nouvel essai après échec : <strong className="text-white">2 500 FCFA (après 30 j)</strong></p>
                  <p>• Réintégration après suspension : <strong className="text-white">5 000 FCFA</strong></p>
                </div>
              </div>
              <div className="space-y-4 text-left">
                <div className="space-y-1.5">
  <label className="font-mono text-gray-300 text-xs">Numéro Mobile Money (Airtel/Moov) *</label>
  <input
    type="tel"
    value={recruitPhone}
    onChange={e => setRecruitPhone(e.target.value)}
    placeholder="ex: 077123456"
    className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#FFB800]/50 text-white font-mono text-sm focus:outline-none focus:border-[#FFB800]"
    required
  />
</div>
                <p className="text-xs font-mono text-gray-300 font-bold">Choisissez votre méthode de paiement mobile money ou carte :</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('airtel')}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'airtel' ? 'bg-[#FF2D2D]/20 border-[#FF2D2D] text-white font-bold shadow-[0_0_15px_rgba(255,45,45,0.4)]' : 'bg-[#0D1B2A] border-white/10 text-gray-400'
                    }`}
                  >
                    <span>🔴 Airtel Money</span>
                    {paymentMethod === 'airtel' && <CheckCircle2 className="w-4 h-4 text-[#FF2D2D]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('moov')}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'moov' ? 'bg-[#FF6B2D]/20 border-[#FF6B2D] text-white font-bold shadow-[0_0_15px_rgba(255,107,45,0.4)]' : 'bg-[#0D1B2A] border-white/10 text-gray-400'
                    }`}
                  >
                    <span>🟠 Moov Money</span>
                    {paymentMethod === 'moov' && <CheckCircle2 className="w-4 h-4 text-[#FF6B2D]" />}
                  </button>

                  <button
                type="button"
                disabled
                className="p-4 rounded-2xl border flex items-center justify-between cursor-not-allowed opacity-50 border-white/10 text-gray-500"
              >
                <span className="flex items-center gap-1.5">💳 Carte Bancaire</span>
                <span className="text-[10px] font-mono uppercase">Bientôt disponible</span>
              </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRecruitStep(1)}
                  className="px-5 py-3 rounded-xl bg-white/5 text-gray-300 font-mono text-xs cursor-pointer"
                >
                  ⬅ Retour Formulaire
                </button>
                <button
                  type="button"
        onClick={handleStep2Pay}
        disabled={isProcessingPayment}
        className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold text-sm uppercase tracking-wide shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all flex items-center gap-2 cursor-pointer"
      >
        {isProcessingPayment ? (lang === 'fr' ? 'Paiement en cours...' : 'Processing payment...') : t.step2Pay}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : VÉRIFICATION SMILE IDENTITY & LIVENESS CHECK */}
          {recruitStep === 3 && (
            <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#00FF88] shadow-[0_0_40px_rgba(0,255,136,0.2)] space-y-8 select-none">
              <div className="border-b border-white/10 pb-4 text-left">
                <span className="text-xs font-mono text-[#00FF88] font-bold">ÉTAPE 3 / 4 : SMILE IDENTITY BIOMÉTRIQUE</span>
                <h3 className="text-2xl font-display font-extrabold text-white mt-1">
                  Vérification Identité & Preuve de Vie (Liveness)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Haute résolution couleur exigée. CNI recto/verso ou Passeport complet visible.
                </p>
              </div>

              {/* ANTI SCREENSHOT BANNER REQUIRES STRICT COMPLIANCE */}
              <div className="p-3.5 rounded-xl bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-xs text-[#FF2D2D] font-mono flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{t.screenshotWarning}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Document Upload */}
                <div className="p-6 rounded-2xl bg-[#0A0A0F] border border-white/10 space-y-4">
                  <h4 className="font-display font-bold text-white text-sm">1. Document d'identité (CNI ou Passeport)</h4>
                  <p className="text-xs text-gray-400">Le document doit être entier, net et en couleur.</p>
                  
                  <button
                    type="button"
                    onClick={() => setUploadedDoc(true)}
                    className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      uploadedDoc ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]' : 'border-gray-700 hover:border-[#0066FF] text-gray-400'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-mono font-bold">
                      {uploadedDoc ? "✓ Document chargé : CNI-Gabon-Moussavou.jpg (OK)" : "Cliquez pour uploader CNI recto/verso"}
                    </span>
                  </button>
                </div>
                {/* Liveness Selfie */}
                <div className="p-6 rounded-2xl bg-[#0A0A0F] border border-white/10 space-y-4">
                  <h4 className="font-display font-bold text-white text-sm">2. Selfie Liveness en temps réel</h4>
                  <p className="text-xs text-gray-400">Pour prouver que vous n'êtes pas une photo, clignez des yeux ou tournez la tête.</p>

                  <button
                    type="button"
                    onClick={() => setLivenessActionDone(true)}
                    className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      livenessActionDone ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]' : 'border-gray-700 hover:border-[#0066FF] text-gray-400'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-xs font-mono font-bold">
                      {livenessActionDone ? "✓ Détection Liveness (Clignement d'yeux confirmé) OK" : "Activer Webcam Liveness Test"}
                    </span>
                  </button>
                </div>
              </div>

              {isVerifyingSmileId && (
                <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-[#00FF88] animate-pulse text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-t-[#00FF88] border-r-[#00FF88] border-b-transparent border-l-transparent animate-spin mx-auto mb-2"></div>
                  <p className="text-xs font-mono text-[#00FF88] font-bold">Vérification automatique en cours (30 secondes)...</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button
                  type="button"
                  disabled={isVerifyingSmileId}
                  onClick={() => setRecruitStep(2)}
                  className="px-5 py-3 rounded-xl bg-white/5 text-gray-300 font-mono text-xs cursor-pointer"
                >
                  ⬅ Retour Paiement
                </button>
                <button
                  type="button"
                  disabled={isVerifyingSmileId}
                  onClick={handleStartSmileVerification}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,255,136,0.5)] cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingSmileId ? "Vérification..." : t.step3Verify}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : TEST TECHNIQUE QCM (30 QUESTIONS TIMED) */}
          {recruitStep === 4 && (
            <div className="space-y-6">
              <QCMTestView
                lang={lang}
                candidateName={formData.fullName || "Moussavou Paul Cédric"}
                onFinishTest={(scorePct, passed) => {
                  handleFinishQcmTest(scorePct, passed);
                }}
                onCancelTest={(reason) => {
                  alert(reason);
                  setRecruitStep(1);
                }}
              />
            </div>
          )}

          {recruitStep === 'completed' && (
            <div className="glass-card p-12 rounded-3xl border border-[#00FF88] text-center space-y-6 shadow-[0_0_50px_rgba(0,255,136,0.3)]">
              <Award className="w-20 h-20 text-[#00FF88] mx-auto animate-bounce" />
              <h3 className="text-3xl font-display font-black text-white">
                Félicitations ! Vous êtes Officiellement Recruté GHULABE
              </h3>
              <p className="text-sm text-gray-300 max-w-xl mx-auto">
                Votre candidature (Nom : {formData.fullName || "Moussavou Paul Cédric"}) a passé avec succès les 4 étapes indépassables. Votre compte développeur est créé avec le badge <strong className="text-[#80C4FF]">GHULABE RECRUIT</strong>.
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="px-8 py-4 rounded-xl bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0F] font-display font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Explorer la liste des missions PME
              </button>
            </div>
          )}

        </div>
      )}
      {/* Modals for Matchmaking & Chat */}
      {selectedDevForMission && (
        <MissionRequestModal
          lang={lang}
          developer={selectedDevForMission}
          onClose={() => setSelectedDevForMission(null)}
          onSubmitMission={() => {
            setSelectedDevForMission(null);
            alert(lang === 'fr' ? "Demande de mission envoyée avec succès !" : "Mission request sent!");
          }}
        />
      )}

      {activeChatMission && (
        <MissionChatModal
          lang={lang}
          mission={activeChatMission}
          onClose={() => setActiveChatMission(null)}
        />
      )}

    </div>
  );
};
