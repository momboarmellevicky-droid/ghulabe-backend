import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../types';
import {
  Terminal, ShieldCheck, AlertOctagon, CheckSquare, Square, Globe,
  Mail, Lock, User, Smartphone, CheckCircle2, X, RotateCcw, Award,
  CreditCard, FileText, Camera, ListChecks, ShieldAlert, Play, Pause,
  ChevronLeft, ChevronRight, ShieldPlus
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

type PhaseId = 'scan' | 'resultat' | 'gardien' | 'dev1' | 'dev2' | 'dev3' | 'dev4' | 'connexion' | 'fin';

interface PhaseConfig {
  id: PhaseId;
  durationMs: number;
  thresholds: number[];
}

const PHASES: PhaseConfig[] = [
  { id: 'scan',      durationMs: 7500,  thresholds: [1400, 2900, 3700, 4500, 5500] },
  { id: 'resultat',  durationMs: 6000,  thresholds: [1800, 3600] },
  { id: 'gardien',   durationMs: 9000,  thresholds: [2200, 4800, 7000] },
  { id: 'dev1',      durationMs: 6000,  thresholds: [1200, 2500, 3800] },
  { id: 'dev2',      durationMs: 6500,  thresholds: [1400, 3200, 5000] },
  { id: 'dev3',      durationMs: 5500,  thresholds: [1400, 3200] },
  { id: 'dev4',      durationMs: 5500,  thresholds: [1500, 3600] },
  { id: 'connexion', durationMs: 4500,  thresholds: [1500, 3000] },
  { id: 'fin',       durationMs: 999999, thresholds: [] },
];

const sampleUrls = ['ebanking-pme-africa.sn', 'boutique-dakar-store.sn', 'fintech-douala-pay.cm', 'assurances-libreville.ga'];

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const DemoAutoPlayView: React.FC<DemoAutoPlayViewProps> = ({ lang, onClose }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);
  const phase = PHASES[phaseIndex];
  const isLast = phaseIndex === PHASES.length - 1;

  const subStep = phase.thresholds.filter(th => elapsedMs >= th).length;

  const goToPhase = (idx: number) => {
    setPhaseIndex(Math.max(0, Math.min(PHASES.length - 1, idx)));
    setElapsedMs(0);
  };

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (paused || isLast) return;
    tickRef.current = setInterval(() => {
      setElapsedMs(prev => {
        const next = prev + 100;
        if (next >= phase.durationMs) {
          goToPhase(phaseIndex + 1);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, paused]);

  const replay = () => { setPaused(false); goToPhase(0); };

  const urlTyped = useTypewriter('ebanking-pme-africa.sn', phase.id === 'scan' && subStep === 0, 1300);
  const devNameTyped = useTypewriter('Paul Moussavou', phase.id === 'dev1' && subStep === 0, 1100);
  const devEmailTyped = useTypewriter('p.moussavou@appsec-gabon.ga', phase.id === 'dev1' && subStep === 1, 1300);
  const portfolioTyped = useTypewriter('github.com/pmoussavou', phase.id === 'dev2' && subStep === 0, 1200);
  const bioTyped = useTypewriter(t('Consultant sécurité, spécialiste OWASP, 5 ans d\'expérience PME…', 'Security consultant, OWASP specialist, 5 years SME experience…'), phase.id === 'dev2' && subStep === 1, 1600);
  const gardienPhoneTyped = useTypewriter('+24177123456', phase.id === 'gardien' && subStep === 1, 1100);
  const loginEmailTyped = useTypewriter('contact@entreprise.ga', phase.id === 'connexion' && subStep === 0, 1200);

  const stepDots = () => (
    <div className="flex items-center justify-center gap-1.5">
      {PHASES.slice(0, -1).map((p, i) => (
        <span key={p.id} className={`h-1.5 rounded-full transition-all ${i === phaseIndex ? 'w-6 bg-[#0066FF]' : i < phaseIndex ? 'w-1.5 bg-[#00FF88]' : 'w-1.5 bg-white/20'}`} />
      ))}
    </div>
  );

  const phaseLabel = () => {
    switch (phase.id) {
      case 'scan': return t('Scène 1/8 — URL & lancement du scan', 'Scene 1/8 — URL & scan launch');
      case 'resultat': return t('Scène 2/8 — Résultat du scan gratuit', 'Scene 2/8 — Free scan result');
      case 'gardien': return t('Scène 3/8 — Activation du mode GARDIEN', 'Scene 3/8 — Activating GARDIEN mode');
      case 'dev1': return t('Scène 4/8 — Portail Développeurs · Étape 1/4', 'Scene 4/8 — Developer Portal · Step 1/4');
      case 'dev2': return t('Scène 5/8 — Portail Développeurs · Étape 2/4', 'Scene 5/8 — Developer Portal · Step 2/4');
      case 'dev3': return t('Scène 6/8 — Portail Développeurs · Étape 3/4', 'Scene 6/8 — Developer Portal · Step 3/4');
      case 'dev4': return t('Scène 7/8 — Portail Développeurs · Étape 4/4', 'Scene 7/8 — Developer Portal · Step 4/4');
      case 'connexion': return t('Scène 8/8 — Connexion', 'Scene 8/8 — Login');
      default: return t('Fin de la démo', 'Demo finished');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0F] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <span className="font-display font-extrabold text-white text-xs block">
            {t('⚡ Démo GHULABE — mode présentation', '⚡ GHULABE demo — presentation mode')}
          </span>
          <span className="text-[#0066FF] font-mono text-[10px]">{phaseLabel()}</span>
        </div>
        <button onClick={onClose} type="button" className="text-gray-400 hover:text-white p-1 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!isLast && (
        <div className="px-4 pt-2 shrink-0">
          <div className="flex items-center justify-between font-mono text-[10px] text-gray-400 mb-1">
            <span>{formatTime(elapsedMs)}</span>
            <span>{formatTime(phase.durationMs)}</span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#0066FF] transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.min(100, (elapsedMs / phase.durationMs) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="py-2.5 shrink-0">{stepDots()}</div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">

        {phase.id === 'scan' && (
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
                  {subStep === 0 && <span className="animate-pulse">|</span>}
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

            {subStep >= 4 && (
              <div className="flex items-center justify-center gap-2 text-[#00FF88] text-xs font-mono animate-pulse">
                <div className="w-3 h-3 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                {t('Analyse en cours…', 'Scanning…')}
              </div>
            )}
          </div>
        )}

        {phase.id === 'resultat' && (
          <div className="pt-3 space-y-4">
            <div className="text-center">
              <p className="text-white font-display font-extrabold text-base">
                {t('Résultat du scan gratuit', 'Free scan result')}
              </p>
              <p className="text-gray-400 text-xs mt-1">ebanking-pme-africa.sn</p>
            </div>
            <div className="glass-card rounded-2xl border border-orange-400/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-white text-2xl">6,5<span className="text-xs text-gray-400">/10</span></span>
                <AlertOctagon className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-[11px] text-gray-400">{t('4 failles détectées — version gratuite', '4 issues found — free version')}</p>
            </div>
            {subStep >= 1 && (
              <div className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-[fadeIn_0.4s_ease]">
                {t('🔒 Détail de chaque faille réservé au plan GARDIEN', '🔒 Details of each issue reserved for GARDIEN plan')}
              </div>
            )}
            {subStep >= 2 && (
              <p className="text-center text-[10px] text-gray-500 animate-[fadeIn_0.4s_ease]">
                {t('Résultat envoyé par email et WhatsApp', 'Result sent by email and WhatsApp')}
              </p>
            )}
          </div>
        )}

        {phase.id === 'gardien' && (
          <div className="pt-3 space-y-4">
            <div className="text-center">
              <ShieldPlus className="w-9 h-9 text-[#00FF88] mx-auto mb-2" />
              <p className="text-white font-display font-extrabold text-base">
                {t('Passer au plan GARDIEN', 'Upgrade to GARDIEN')}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {t('Surveillance automatique de vos domaines + détail complet des failles', 'Automatic domain monitoring + full issue details')}
              </p>
            </div>

            {subStep >= 1 && (
              <div className="grid grid-cols-1 gap-2 animate-[fadeIn_0.4s_ease]">
                <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-4 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#00FF88] shrink-0" />
                  <div>
                    <p className="text-white text-xs font-bold">{t('Mobile Money — 5000 FCFA', 'Mobile Money — 5000 FCFA')}</p>
                    <p className="text-gray-400 text-[10px]">Airtel Money / Moov Money — {t('Afrique', 'Africa')}</p>
                  </div>
                </div>
                <div className="text-center text-gray-500 text-[10px] font-mono">{t('— ou —', '— or —')}</div>
                <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#0066FF] shrink-0" />
                  <div>
                    <p className="text-white text-xs font-bold">{t('Carte bancaire — 9 $US', 'Card payment — $9 USD')}</p>
                    <p className="text-gray-400 text-[10px]">Visa / Mastercard — {t('International', 'International')}</p>
                  </div>
                </div>
              </div>
            )}

            {subStep >= 2 && (
              <div className="space-y-1 animate-[fadeIn_0.4s_ease]">
                <label className="font-mono text-gray-400 text-[10px]">{t('Numéro Mobile Money', 'Mobile Money number')}</label>
                <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-2.5">
                  <Smartphone className="w-4 h-4 text-[#0066FF]" />
                  <span className="font-mono text-xs text-white">{gardienPhoneTyped}<span className="animate-pulse">|</span></span>
                </div>
              </div>
            )}

            {subStep >= 3 && (
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
                <p className="text-[10px] text-gray-500 pt-1 border-t border-white/10">
                  {t('3 domaines désormais suivis, scans automatiques réguliers.', '3 domains now monitored, regular automatic scans.')}
                </p>
              </div>
            )}
          </div>
        )}

        {phase.id === 'dev1' && (
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

        {phase.id === 'dev2' && (
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

        {phase.id === 'dev3' && (
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
                <p className="text-white text-xs">{t('Pièce d\'identité téléversée (vraie caméra)', 'ID document uploaded (real camera)')}</p>
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

        {phase.id === 'dev4' && (
          <StepShell title={t('Étape 4/4 — Test de compétences', 'Step 4/4 — Skills test')} icon={<ListChecks className="w-4 h-4" />}>
            <div className="glass-card rounded-2xl border border-[#0066FF]/30 p-3 flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#0066FF] shrink-0 animate-pulse" />
              <p className="text-white text-xs">{t('QCM en cours — caméra active', 'Test in progress — camera active')}</p>
            </div>
            {subStep >= 1 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-3 animate-[fadeIn_0.4s_ease]">
                <p className="text-white text-xs font-bold">{t('Score : 85%', 'Score: 85%')}</p>
                <p className="text-gray-400 text-[10px]">{t('Test réussi — validation finale manuelle par l\'équipe', 'Passed — final validation done manually by the team')}</p>
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

        {phase.id === 'connexion' && (
          <div className="pt-3 space-y-4">
            <div className="text-center">
              <Lock className="w-9 h-9 text-[#0066FF] mx-auto mb-2" />
              <p className="text-white font-display font-extrabold text-base">
                {t('Connexion à votre compte', 'Log in to your account')}
              </p>
            </div>
            <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-3">
              <Field icon={<Mail className="w-4 h-4 text-[#0066FF]" />} label="Email" value={loginEmailTyped} active={subStep === 0} />
              {subStep >= 1 && <Field icon={<Lock className="w-4 h-4 text-[#0066FF]" />} label={t('Mot de passe', 'Password')} value={'•'.repeat(9)} active={false} />}
            </div>
            {subStep >= 2 && (
              <div className="flex items-center justify-center gap-2 text-[#00FF88] text-xs font-mono animate-[fadeIn_0.4s_ease]">
                <CheckCircle2 className="w-4 h-4" /> {t('Connexion réussie', 'Login successful')}
              </div>
            )}
          </div>
        )}

        {phase.id === 'fin' && (
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

      {!isLast && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => goToPhase(phaseIndex - 1)}
            disabled={phaseIndex === 0}
            className="p-2.5 rounded-xl border border-white/15 text-gray-300 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF]/15 border border-[#0066FF] text-[#0066FF] font-bold text-xs"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? t('Reprendre', 'Resume') : t('Pause', 'Pause')}
          </button>
          <button
            type="button"
            onClick={() => goToPhase(phaseIndex + 1)}
            className="p-2.5 rounded-xl border border-white/15 text-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
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
