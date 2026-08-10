import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../types';
import {
  Terminal, ShieldCheck, AlertOctagon, CheckSquare, Square, Globe,
  Mail, Lock, User, Smartphone, CheckCircle2, X, RotateCcw, Award,
  CreditCard, FileText, Camera, ListChecks, ShieldAlert
} from 'lucide-react';

interface DemoAutoPlayViewProps {
  lang: Language;
  onClose: () => void;
}

function useTypewriter(text: string, active: boolean, durationMs: number): string {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!active) { setDisplay(''); return; }
    setDisplay('');
    let i = 0;
    const stepMs = Math.max(15, durationMs / Math.max(text.length, 1));
    const interval = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, stepMs);
    return () => clearInterval(interval);
  }, [text, active, durationMs]);
  return display;
}

// 0 = Accueil / Scanner (écran réel HomeView)
// 1 = Créer un compte PME + activation GARDIEN (écran réel AuthView)
// 2..5 = les 4 étapes réelles du portail développeur (DevsPortalView)
// 6 = fin
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const sampleUrls = ['ebanking-pme-africa.sn', 'boutique-dakar-store.sn', 'fintech-douala-pay.cm', 'assurances-libreville.ga'];

export const DemoAutoPlayView: React.FC<DemoAutoPlayViewProps> = ({ lang, onClose }) => {
  const [phase, setPhase] = useState<Phase>(0);
  const [subStep, setSubStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  const goTo = (p: Phase) => { setPhase(p); setSubStep(0); };

  useEffect(() => {
    clearAllTimers();
    if (phase === 0) {
      after(1500, () => setSubStep(1));
      after(3000, () => setSubStep(2));
      after(3800, () => setSubStep(3));
      after(5600, () => setSubStep(4));
      after(8200, () => goTo(1));
    } else if (phase === 1) {
      after(1300, () => setSubStep(1));
      after(2700, () => setSubStep(2));
      after(4000, () => setSubStep(3));
      after(5200, () => setSubStep(4));
      after(7000, () => setSubStep(5));
      after(9800, () => goTo(2));
    } else if (phase === 2) {
      after(1200, () => setSubStep(1));
      after(2500, () => setSubStep(2));
      after(3800, () => setSubStep(3));
      after(5600, () => goTo(3));
    } else if (phase === 3) {
      after(1400, () => setSubStep(1));
      after(3200, () => setSubStep(2));
      after(5000, () => goTo(4));
    } else if (phase === 4) {
      after(1200, () => setSubStep(1));
      after(2800, () => setSubStep(2));
      after(4600, () => goTo(5));
    } else if (phase === 5) {
      after(1500, () => setSubStep(1));
      after(3200, () => setSubStep(2));
      after(5000, () => goTo(6));
    }
    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const replay = () => { clearAllTimers(); goTo(0); };

  const urlTyped = useTypewriter('ebanking-pme-africa.sn', phase === 0 && subStep === 0, 1300);
  const nameTyped = useTypewriter('Mombo Armelle Vicky', phase === 1 && subStep === 0, 1200);
  const waTyped = useTypewriter('+24177123456', phase === 1 && subStep === 1, 1000);
  const emailTyped = useTypewriter('contact@entreprise.ga', phase === 1 && subStep === 2, 1300);
  const devNameTyped = useTypewriter('Paul Moussavou', phase === 2 && subStep === 0, 1100);
  const devEmailTyped = useTypewriter('p.moussavou@appsec-gabon.ga', phase === 2 && subStep === 1, 1300);
  const portfolioTyped = useTypewriter('github.com/pmoussavou', phase === 3 && subStep === 0, 1200);
  const bioTyped = useTypewriter(t('Consultant sécurité, spécialiste OWASP, 5 ans d\'expérience PME…', 'Security consultant, OWASP specialist, 5 years SME experience…'), phase === 3 && subStep === 1, 1600);

  const stepDots = (total: number, current: number) => (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-[#0066FF]' : i < current ? 'w-1.5 bg-[#00FF88]' : 'w-1.5 bg-white/20'}`} />
      ))}
    </div>
  );

  const phaseLabel = () => {
    if (phase === 0) return t('Accueil — Scanner un site', 'Home — Scan a website');
    if (phase === 1) return t('Créer un compte & activer GARDIEN', 'Create account & activate GARDIEN');
    if (phase >= 2 && phase <= 5) return t(`Portail Développeurs — Étape ${phase - 1}/4`, `Developer Portal — Step ${phase - 1}/4`);
    return t('Fin de la démo', 'Demo finished');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <span className="font-display font-extrabold text-white text-xs block">
            {t('⚡ Démo automatique GHULABE', '⚡ GHULABE auto demo')}
          </span>
          <span className="text-[#0066FF] font-mono text-[10px]">{phaseLabel()}</span>
        </div>
        <button onClick={onClose} type="button" className="text-gray-400 hover:text-white p-1 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="py-2.5 shrink-0">{stepDots(6, phase)}</div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">

        {phase === 0 && (
          <div className="pt-3 space-y-4">
            <div className="text-center">
              <ShieldCheck className="w-9 h-9 text-[#0066FF] mx-auto mb-2" />
              <p className="text-white font-display font-extrabold text-lg italic">
                "{t('Une URL. Un scan. Zéro faille cachée.', 'One URL. One scan. Zero hidden flaw.')}"
              </p>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                {t(
                  'Analyse externe ultrarapide (< 60 sec) sans installation interne. Détection des fichiers exposés (.env, .git), serveurs vulnérables, failles OWASP et certificats SSL.',
                  'Ultra-fast external scanning (< 60 sec). Detects exposed files (.env, .git), vulnerable software, OWASP flaws and SSL certificates.'
                )}
              </p>
            </div>

            <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-4">
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                <div className="w-full pl-10 pr-3 py-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs">
                  {subStep >= 1 ? urlTyped || 'ebanking-pme-africa.sn' : (
                    <span className="text-gray-500">ex: monentreprise-dakar.com</span>
                  )}
                  {phase === 0 && subStep === 0 && <span className="animate-pulse">|</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center text-[10px] font-mono">
                <span className="text-gray-500">{t('Exemples de test direct :', 'Quick test examples:')}</span>
                {sampleUrls.map(s => (
                  <span key={s} className={`px-2 py-0.5 rounded border ${subStep >= 1 && s === 'ebanking-pme-africa.sn' ? 'border-[#00FF88] text-[#00FF88] bg-[#00FF88]/10' : 'border-white/10 text-gray-400'}`}>
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                {subStep >= 2 ? <CheckSquare className="w-4 h-4 text-[#00FF88] shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />}
                <span className="text-[10px] text-gray-400 leading-relaxed">
                  {t('Je certifie être le propriétaire ou l\'administrateur autorisé de ce domaine.', 'I certify I am the owner or authorized administrator of this domain.')}
                </span>
              </div>

              <div className={`w-full py-3 rounded-xl font-display font-extrabold text-xs text-center flex items-center justify-center gap-2 ${subStep >= 3 ? 'bg-gradient-to-r from-[#0066FF] to-[#0047B3] text-white' : 'bg-white/5 text-gray-500'}`}>
                <Terminal className="w-4 h-4" />
                {t('DÉMARRER LE SCAN', 'START SCAN')}
              </div>
            </div>

            {subStep === 3 && (
              <div className="flex items-center justify-center gap-2 text-[#00FF88] text-xs font-mono animate-pulse">
                <div className="w-3 h-3 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                {t('Analyse en cours…', 'Scanning…')}
              </div>
            )}

            {subStep >= 4 && (
              <div className="glass-card rounded-2xl border border-orange-400/40 p-4 space-y-2 animate-[fadeIn_0.4s_ease]">
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-white text-xl">6,5<span className="text-xs text-gray-400">/10</span></span>
                  <AlertOctagon className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-[11px] text-gray-400">{t('4 failles détectées — version gratuite', '4 issues found — free version')}</p>
                <div className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  {t('🔒 Détail réservé au plan GARDIEN', '🔒 Details reserved for GARDIEN plan')}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 1 && (
          <div className="pt-3 space-y-4">
            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-[#0066FF]/20 text-[#0066FF] font-mono text-[10px] font-bold uppercase">
                🔒 {t('2FA obligatoire · AES-256', '2FA mandatory · AES-256')}
              </span>
              <p className="text-white font-display font-extrabold text-lg mt-2">
                {t('Créer un compte PME', 'Create SME Account')}
              </p>
            </div>

            <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-3">
              <Field icon={<User className="w-4 h-4 text-[#0066FF]" />} label={t('Nom ou Raison Sociale', 'Full Name / Company')} value={nameTyped} active={subStep === 0} />
              {subStep >= 1 && <Field icon={<Smartphone className="w-4 h-4 text-[#0066FF]" />} label={t('Numéro WhatsApp', 'WhatsApp number')} value={waTyped} active={subStep === 1} />}
              {subStep >= 2 && <Field icon={<Mail className="w-4 h-4 text-[#0066FF]" />} label="Email" value={emailTyped} active={subStep === 2} />}
              {subStep >= 3 && <Field icon={<Lock className="w-4 h-4 text-[#0066FF]" />} label={t('Mot de passe', 'Password')} value={'•'.repeat(9)} active={false} />}
            </div>

            {subStep === 4 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-4 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#00FF88] animate-pulse" />
                <div>
                  <p className="text-white text-xs font-bold">{t('Paiement Mobile Money — 5000 FCFA', 'Mobile Money payment — 5000 FCFA')}</p>
                  <p className="text-gray-400 text-[10px]">{t('Activation du plan GARDIEN…', 'Activating GARDIEN plan…')}</p>
                </div>
              </div>
            )}

            {subStep >= 5 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-4 space-y-2 animate-[fadeIn_0.4s_ease]">
                <div className="flex items-center gap-2 text-[#00FF88] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> {t('GARDIEN activé — détail débloqué', 'GARDIEN activated — details unlocked')}
                </div>
                <ul className="text-[10px] text-gray-300 space-y-1 font-mono">
                  <li>⚠ HSTS manquant</li>
                  <li>⚠ Certificat SSL expire dans 12 jours</li>
                  <li>⚠ CSP absent</li>
                  <li>⚠ Fichier .env exposé — {t('critique', 'critical')}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {phase === 2 && (
          <StepShell title={t('Étape 1/4 — Formulaire d\'inscription candidat', 'Step 1/4 — Candidate registration form')} icon={<FileText className="w-4 h-4" />}>
            <Field icon={<User className="w-4 h-4 text-[#0066FF]" />} label={t('Nom complet (identique CNI)', 'Full name (matches ID)')} value={devNameTyped} active={subStep === 0} />
            {subStep >= 1 && <Field icon={<Mail className="w-4 h-4 text-[#0066FF]" />} label={t('Email professionnel', 'Professional email')} value={devEmailTyped} active={subStep === 1} />}
            {subStep >= 2 && <Field icon={<Globe className="w-4 h-4 text-[#0066FF]" />} label={t('Pays / Ville', 'Country / City')} value="Gabon — Libreville" active={false} />}
            {subStep >= 3 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Badge label={t('AppSec', 'AppSec')} active />
                <Badge label={t('Headers HTTP', 'HTTP Headers')} active />
              </div>
            )}
          </StepShell>
        )}

        {phase === 3 && (
          <StepShell title={t('Étape 2/4 — Compétences & Portfolio', 'Step 2/4 — Skills & Portfolio')} icon={<ListChecks className="w-4 h-4" />}>
            <Field icon={<Globe className="w-4 h-4 text-[#0066FF]" />} label="Portfolio GitHub / LinkedIn" value={portfolioTyped} active={subStep === 0} />
            {subStep >= 1 && (
              <div className="space-y-1">
                <label className="font-mono text-gray-400 text-[10px]">{t('Bio & Expérience', 'Bio & Experience')}</label>
                <div className="w-full px-3 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-[11px] min-h-[60px]">
                  {bioTyped}{subStep === 1 && <span className="animate-pulse">|</span>}
                </div>
              </div>
            )}
            {subStep >= 2 && (
              <div className="flex items-center gap-2 pt-1">
                <CheckSquare className="w-4 h-4 text-[#00FF88] shrink-0" />
                <span className="text-[10px] text-gray-400">{t('Clause de prestataire indépendant acceptée', 'Independent contractor clause accepted')}</span>
              </div>
            )}
          </StepShell>
        )}

        {phase === 4 && (
          <StepShell title={t('Étape 3/4 — Paiement & Vérification', 'Step 3/4 — Payment & Verification')} icon={<ShieldAlert className="w-4 h-4" />}>
            <div className="glass-card rounded-2xl border border-[#0066FF]/30 p-3 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#0066FF] shrink-0" />
              <div>
                <p className="text-white text-xs font-bold">{t('Frais de candidature — 5000 FCFA', 'Application fee — 5000 FCFA')}</p>
                <p className="text-gray-400 text-[10px]">Airtel Money</p>
              </div>
            </div>
            {subStep >= 1 && (
              <div className="glass-card rounded-2xl border border-[#0066FF]/30 p-3 flex items-center gap-3 animate-[fadeIn_0.4s_ease]">
                <FileText className="w-5 h-5 text-[#0066FF] shrink-0" />
                <p className="text-white text-xs">{t('Pièce d\'identité téléversée', 'ID document uploaded')}</p>
              </div>
            )}
            {subStep >= 2 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-3 flex items-center gap-3 animate-[fadeIn_0.4s_ease]">
                <Camera className="w-5 h-5 text-[#00FF88] shrink-0" />
                <div>
                  <p className="text-white text-xs font-bold">{t('Selfie de vérification capturé', 'Verification selfie captured')}</p>
                  <p className="text-gray-400 text-[10px]">{t('Preuve de vie confirmée', 'Liveness confirmed')}</p>
                </div>
              </div>
            )}
          </StepShell>
        )}

        {phase === 5 && (
          <StepShell title={t('Étape 4/4 — Test de compétences', 'Step 4/4 — Skills test')} icon={<ListChecks className="w-4 h-4" />}>
            <div className="glass-card rounded-2xl border border-[#0066FF]/30 p-3 flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#0066FF] shrink-0 animate-pulse" />
              <p className="text-white text-xs">{t('QCM en cours — caméra active', 'Test in progress — camera active')}</p>
            </div>
            {subStep >= 1 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-3 animate-[fadeIn_0.4s_ease]">
                <p className="text-white text-xs font-bold">{t('Score : 85%', 'Score: 85%')}</p>
                <p className="text-gray-400 text-[10px]">{t('Test réussi — en revue par l\'équipe', 'Passed — under team review')}</p>
              </div>
            )}
            {subStep >= 2 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 flex flex-col items-center text-center gap-2 animate-[fadeIn_0.4s_ease]">
                <Award className="w-10 h-10 text-[#00FF88]" />
                <p className="text-white font-display font-extrabold text-sm">GHULABE CERTIFIED</p>
              </div>
            )}
          </StepShell>
        )}

        {phase === 6 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-5 pt-10">
            <CheckCircle2 className="w-14 h-14 text-[#00FF88]" />
            <p className="text-white font-display font-bold text-base">{t('Démonstration terminée', 'Demo finished')}</p>
            <p className="text-gray-400 text-xs max-w-xs">
              {t('Simulation à but pédagogique — aucune donnée réelle n\'a été créée.', 'Illustrative simulation — no real data was created.')}
            </p>
            <button onClick={replay} type="button" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF]/15 border border-[#0066FF] text-[#0066FF] font-bold text-xs">
              <RotateCcw className="w-4 h-4" /> {t('Revoir la démo', 'Watch again')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StepShell: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="pt-3 space-y-4">
    <div className="flex items-center gap-2 text-[#0066FF] font-mono text-[11px] uppercase tracking-wide">
      {icon} {title}
    </div>
    <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-3">
      {children}
    </div>
  </div>
);

const Field: React.FC<{ icon: React.ReactNode; label: string; value: string; active: boolean }> = ({ icon, label, value, active }) => (
  <div className="space-y-1">
    <label className="font-mono text-gray-400 text-[10px]">{label}</label>
    <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-2.5">
      {icon}
      <span className="font-mono text-xs text-white">{value}{active && <span className="animate-pulse">|</span>}</span>
    </div>
  </div>
);

const Badge: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <div className={`rounded-xl border p-2 text-center text-[10px] font-mono ${active ? 'border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88]' : 'border-white/10 text-gray-500'}`}>
    {label}
  </div>
);
