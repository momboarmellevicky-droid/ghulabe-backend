import React, { useState } from 'react';
import { Language, TabType } from '../../types';
import { getT } from '../../data/i18n';
import { Logo3DEye } from '../common/Logo3DEye';
import { 
  Terminal, ShieldCheck, Zap, AlertOctagon, CheckSquare, 
  Square, ArrowRight, CheckCircle2, Clock, Globe
} from 'lucide-react';

interface HomeViewProps {
  lang: Language;
  onStartScan: (url: string, consentAccepted: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  onSelectPlan: (plan: 'gratuit' | 'gardien' | 'pentest_premium') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lang,
  onStartScan,
  setActiveTab,
  onSelectPlan
}) => {
  const t = getT(lang);
  const [url, setUrl] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setErrorMsg(t.scanConsentError);
      return;
    }
    if (!url || !url.includes('.')) {
      setErrorMsg(lang === 'fr' ? "Veuillez entrer une URL de domaine valide (ex: monentreprise.com)" : "Please enter a valid domain URL (e.g., mybusiness.com)");
      return;
    }
    setErrorMsg('');
    onStartScan(url, true);
  };

  const sampleUrls = [
    'ebanking-pme-africa.sn',
    'boutique-dakar-store.sn',
    'fintech-douala-pay.cm',
    'assurances-libreville.ga'
  ];

  return (
    <div className="space-y-4 md:space-y-6 pb-8 pt-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Hero Section */}
      <section className="relative text-center flex flex-col items-center justify-center pt-2 pb-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0066FF]/10 via-transparent to-transparent blur-3xl -z-10"></div>
        
        {/* 3D Eye + GHULABE + Slogan */}
        <Logo3DEye size="hero" showText={true} showSlogan={true} lang={lang} />

        <p className="mt-2 max-w-2xl text-sm sm:text-lg text-gray-300 font-light leading-relaxed">
          {lang === 'fr' 
            ? "Analyse externe ultrarapide (< 60 sec) sans installation interne. Détection des fichiers exposés (.env, .git), serveurs vulnérables, failles OWASP et certificats SSL pour protéger les PME africaines."
            : "Ultra-fast external scanning (< 60 sec) without internal access. Detects exposed files (.env, .git), vulnerable software, OWASP flaws, and SSL certificates to safeguard African SMEs."
          }
        </p>

        {/* Quick Scan Input Form with Mandatory Consent */}
        <div className="mt-4 w-full max-w-3xl glass-card p-4 sm:p-6 rounded-2xl border border-[#0066FF]/40 shadow-[0_0_40px_rgba(0,102,255,0.2)]">
          <form onSubmit={handleScanSubmit} className="space-y-6">
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0066FF]" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={t.urlInputPlaceholder}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] transition-all"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#005CE6] to-[#0047B3] hover:from-[#00FF88] hover:to-[#00CC6A] hover:text-[#0A0A0F] text-white font-display font-extrabold text-sm sm:text-base tracking-wide uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,102,255,0.6)] cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-[#80C4FF]/40"
              >
                <Terminal className="w-5 h-5" />
                <span>{t.startScanBtn}</span>
              </button>
            </div>

            {/* Quick prefill badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              <span className="text-gray-400">{lang === 'fr' ? "Exemples de test direct :" : "Quick test examples:"}</span>
              {sampleUrls.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setUrl(s);
                    setConsentAccepted(true);
                  }}
                  className="px-2.5 py-1 rounded bg-[#0D1B2A] hover:bg-[#0066FF]/30 text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* MANDATORY CONSENT CHECKBOX */}
            <div className="pt-3 border-t border-white/10 text-left">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div 
                  onClick={() => {
                    setConsentAccepted(!consentAccepted);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="mt-0.5 shrink-0"
                >
                  {consentAccepted ? (
                    <CheckSquare className="w-5 h-5 text-[#00FF88] fill-[#00FF88]/10" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-500 group-hover:text-[#0066FF]" />
                  )}
                </div>
                <span className="text-xs text-gray-300 leading-relaxed font-sans">
                  {t.scanConsentLabel}
                </span>
              </label>
              {errorMsg && (
                <p className="mt-2 text-xs font-semibold text-[#FF2D2D] flex items-center gap-1.5 animate-bounce">
                  <AlertOctagon className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

          </form>
        </div>
      </section>

      {/* Danger Severity Levels (Required) */}
      <section className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/30">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            {lang === 'fr' ? "Niveaux de Danger & Priorités de Correction" : "Danger Levels & Fix Priorities"}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {lang === 'fr' ? "Classification normée GHULABE selon l'impact critique sur les PME." : "GHULABE standardized classification based on SME business impact."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#FF2D2D]/10 border border-[#FF2D2D]/40 text-left flex flex-col justify-between">
            <div>
              <span className="text-2xl">🔴</span>
              <h3 className="font-display font-bold text-lg text-[#FF2D2D] mt-2">
                {lang === 'fr' ? "Critique" : "Critical"}
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                {lang === 'fr' ? "Correction obligatoire sous 24h" : "Mandatory fix within 24h"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {lang === 'fr' ? "Faille active (Ex: Injection SQL, .env exposé). Piratage imminent possible." : "Active exploit (e.g. SQL Injection, exposed .env). Immediate takeover risk."}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FF6B2D]/10 border border-[#FF6B2D]/40 text-left flex flex-col justify-between">
            <div>
              <span className="text-2xl">🟠</span>
              <h3 className="font-display font-bold text-lg text-[#FF6B2D] mt-2">
                {lang === 'fr' ? "Élevé" : "High"}
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                {lang === 'fr' ? "Correction requise sous 7 jours" : "Correction within 7 days"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {lang === 'fr' ? "Certificat SSL expirant, HSTS absent, serveur obsolète vulnérable aux CVE connus." : "Expiring SSL cert, missing HSTS, obsolete server vulnerable to known CVEs."}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFB800]/10 border border-[#FFB800]/40 text-left flex flex-col justify-between">
            <div>
              <span className="text-2xl">🟡</span>
              <h3 className="font-display font-bold text-lg text-[#FFB800] mt-2">
                {lang === 'fr' ? "Moyen" : "Medium"}
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                {lang === 'fr' ? "Correction planifiée" : "Planned correction"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {lang === 'fr' ? "En-têtes CSP/X-Frame manquants, cookies sans flag Secure." : "Missing CSP/X-Frame headers, cookies missing Secure flag."}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0066FF]/10 border border-[#0066FF]/40 text-left flex flex-col justify-between">
            <div>
              <span className="text-2xl">🔵</span>
              <h3 className="font-display font-bold text-lg text-[#4DA8FF] mt-2">
                {lang === 'fr' ? "Faible" : "Low"}
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                {lang === 'fr' ? "Correction recommandée" : "Recommended fix"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {lang === 'fr' ? "Divulgation passive de version serveur, bonnes pratiques DNS SPF/DKIM." : "Passive server version disclosure, DNS SPF/DKIM best practices."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Engine */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/10 hover:border-[#0066FF]/50 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-2">
            <Clock className="w-6 h-6 text-[#00FF88]" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'fr' ? "Scan en < 60 Secondes" : "Scan in < 60 Seconds"}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {lang === 'fr' ? "Sondes asynchrones adaptées aux connexions 3G africaines. Rapport immédiat." : "Asynchronous probes optimized for African 3G networks. Immediate report."}
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#0066FF]/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-4">
            <Zap className="w-6 h-6 text-[#0066FF]" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'fr' ? "Détails & Code Prêt à Copier" : "Details & Copy-Paste Fix Code"}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {lang === 'fr' ? "Section Patron pour les décisions, Section Développeur avec le code exact de correction." : "CEO section for strategic clarity, Developer section with exact copy-paste fix code."}
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#0066FF]/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#0066FF]/20 flex items-center justify-center text-[#0066FF] mb-4">
            <ShieldCheck className="w-6 h-6 text-[#FFB800]" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'fr' ? "Réseau d'Experts Certifiés" : "Network of Certified Experts"}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {lang === 'fr' ? "Recrutement en 4 étapes avec liveness check Smile Identity et test technique QCM séquentiel." : "4-step recruitment with Smile Identity liveness check and sequential QCM technical test."}
          </p>
        </div>
      </section>

      {/* Pricing Plans (Modèle Économique) */}
      <section className="pt-2">
        <div className="text-center max-w-3xl mx-auto mb-4">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            {t.plansTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {t.plansSub}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* 1. GRATUIT */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border border-white/10 relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 font-mono text-xs font-bold">
                  {t.planFree.name}
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-display font-extrabold text-white">0</span>
                <span className="text-sm font-mono text-gray-400">FCFA {t.planFree.period}</span>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                {t.planFree.desc}
              </p>
              <ul className="mt-8 space-y-3">
                {t.planFree.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#0066FF] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('gratuit')}
              className="mt-10 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.planFree.cta}
            </button>
          </div>

          {/* 2. GARDIEN (Recommandé) */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-2 border-[#0066FF] bg-gradient-to-b from-[#0066FF]/15 via-[#0D1B2A] to-[#0A0A0F] shadow-[0_0_35px_rgba(0,102,255,0.3)] relative transform lg:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00FF88] text-[#0A0A0F] font-mono text-xs font-black uppercase tracking-wider shadow-lg">
              {t.planGardien.popular}
            </div>

            <div>
              <div className="flex items-center justify-between mt-2">
                <span className="px-3 py-1 rounded-full bg-[#0066FF]/30 text-[#00FF88] font-mono text-xs font-bold">
                  {t.planGardien.name}
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-display font-extrabold text-white">5 000</span>
                <span className="text-sm font-mono text-[#00FF88]">FCFA {t.planGardien.period}</span>
              </div>
              <p className="mt-4 text-xs text-gray-300">
                {t.planGardien.desc}
              </p>
              <ul className="mt-8 space-y-3">
                {t.planGardien.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('gardien')}
              className="mt-10 w-full py-4 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] hover:from-[#0052CC] hover:to-[#00CC6A] text-[#0A0A0F] text-sm font-display font-extrabold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] cursor-pointer"
            >
              {t.planGardien.cta}
            </button>
          </div>

          {/* 3. PENTEST PREMIUM */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border border-[#FF6B2D]/40 relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#FF6B2D]/20 text-[#FF6B2D] font-mono text-xs font-bold">
                  {t.planPentest.name}
                </span>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-display font-extrabold text-white">25 000</span>
                <span className="text-sm font-mono text-[#FF6B2D]">FCFA {t.planPentest.period}</span>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                {t.planPentest.desc}
              </p>
              <ul className="mt-8 space-y-3">
                {t.planPentest.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B2D] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('pentest_premium')}
              className="mt-10 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B2D] to-[#E64D00] hover:from-[#E64D00] hover:to-[#CC4400] text-white text-sm font-display font-bold uppercase transition-all shadow-[0_0_15px_rgba(255,107,45,0.3)] cursor-pointer"
            >
              {t.planPentest.cta}
            </button>
          </div>

        </div>
      </section>

      {/* Recrutement banner CTA */}
      <section className="glass-card p-8 rounded-3xl border border-[#00FF88]/40 bg-gradient-to-r from-[#0D1B2A] to-[#0A0A0F] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="px-2.5 py-1 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono text-xs font-bold uppercase">
            Recrutement Ouvert • ghulabe.com/dev
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
            {lang === 'fr' ? "Êtes-vous un Développeur ou Pentester Africain ?" : "Are you an African Security Developer?"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            {lang === 'fr' 
              ? "Passez notre vérification liveness Smile Identity, réussissez le test technique QCM sous surveillance et percevez 85% net de chaque mission sur GHULABE."
              : "Pass our Smile Identity liveness check, ace the supervised QCM test, and earn 85% net on every cybersecurity mission."
            }
          </p>
        </div>
        <button
          onClick={() => setActiveTab('devs')}
          className="px-6 py-4 rounded-xl bg-[#00FF88] hover:bg-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-sm uppercase transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span>{lang === 'fr' ? "Postuler en 4 Étapes" : "Apply Now (4 Steps)"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

    </div>
  );
};
