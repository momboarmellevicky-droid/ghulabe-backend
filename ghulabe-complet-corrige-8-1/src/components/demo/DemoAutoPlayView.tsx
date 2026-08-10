import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../types';
import {
  Search, ShieldCheck, ShieldAlert, Mail, Lock, User, Smartphone,
  CheckCircle2, X, Play, RotateCcw, ArrowRight, Award, CreditCard, Globe
} from 'lucide-react';

interface DemoAutoPlayViewProps {
  lang: Language;
  onClose: () => void;
}

// Effet machine à écrire : révèle `text` lettre par lettre sur `durationMs`.
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

type Phase = 0 | 1 | 2 | 3 | 4; // 0=intro, 1=scan, 2=gardien, 3=devs, 4=fin

export const DemoAutoPlayView: React.FC<DemoAutoPlayViewProps> = ({ lang, onClose }) => {
  const [phase, setPhase] = useState<Phase>(0);
  const [subStep, setSubStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  // Orchestration : chaque phase avance ses sous-étapes puis passe à la phase suivante.
  useEffect(() => {
    clearAllTimers();
    if (phase === 0) {
      after(1800, () => { setPhase(1); setSubStep(0); });
    } else if (phase === 1) {
      after(1600, () => setSubStep(1)); // scan lancé
      after(3400, () => setSubStep(2)); // résultat affiché
      after(6200, () => { setPhase(2); setSubStep(0); });
    } else if (phase === 2) {
      after(1200, () => setSubStep(1)); // email tapé
      after(2600, () => setSubStep(2)); // mdp tapé
      after(3600, () => setSubStep(3)); // paiement en cours
      after(5400, () => setSubStep(4)); // dashboard affiché
      after(8200, () => { setPhase(3); setSubStep(0); });
    } else if (phase === 3) {
      after(1200, () => setSubStep(1)); // nom tapé
      after(2600, () => setSubStep(2)); // whatsapp tapé
      after(3800, () => setSubStep(3)); // portfolio tapé
      after(5000, () => setSubStep(4)); // paiement mobile money
      after(6600, () => setSubStep(5)); // badge délivré
      after(9200, () => { setPhase(4); setSubStep(0); });
    }
    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const replay = () => { clearAllTimers(); setPhase(0); setSubStep(0); };

  const scanUrlTyped = useTypewriter('example.com', phase === 1 && subStep === 0, 1400);
  const emailTyped = useTypewriter('contact@entreprise.ga', phase === 2 && subStep === 0, 1300);
  const nameTyped = useTypewriter('Paul Moussavou', phase === 3 && subStep === 0, 1200);
  const waTyped = useTypewriter('+241771234 56', phase === 3 && subStep === 1, 1200);
  const portfolioTyped = useTypewriter('github.com/pmoussavou', phase === 3 && subStep === 2, 1300);

  const dots = [1, 2, 3].map(p => (
    <span
      key={p}
      className={`w-2 h-2 rounded-full transition-all ${phase === p ? 'bg-[#0066FF] w-6' : phase > p ? 'bg-[#00FF88]' : 'bg-white/20'}`}
    />
  ));

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <span className="font-display font-extrabold text-white text-sm tracking-wide">
          {t('⚡ Démo automatique GHULABE', '⚡ GHULABE auto demo')}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1" type="button">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 py-3">{dots}</div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* PHASE 0 — Intro */}
        {phase === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 animate-pulse">
            <ShieldCheck className="w-16 h-16 text-[#0066FF]" />
            <p className="text-gray-300 text-sm max-w-xs">
              {t(
                'Cette démonstration va vous montrer, sans rien saisir vous-même, comment fonctionne le scan, le compte GARDIEN et le portail développeurs.',
                'This demo will show you, without typing anything yourself, how the scan, the GARDIEN account and the developer portal work.'
              )}
            </p>
          </div>
        )}

        {/* PHASE 1 — Scan */}
        {phase === 1 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-[#0066FF] font-mono text-xs uppercase tracking-wider">
              {t('1/3 — Scanner un site web', '1/3 — Scan a website')}
            </h3>
            <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4">
              <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                <Search className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span className="font-mono text-sm text-white">{scanUrlTyped}<span className="animate-pulse">|</span></span>
              </div>
            </div>

            {subStep >= 1 && (
              <div className="flex items-center gap-2 text-[#00FF88] text-xs font-mono animate-pulse">
                <div className="w-3 h-3 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                {t('Analyse du site en cours…', 'Scanning the site…')}
              </div>
            )}

            {subStep >= 2 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 space-y-3 animate-[fadeIn_0.4s_ease]">
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-white text-2xl">6,5<span className="text-sm text-gray-400">/10</span></span>
                  <ShieldAlert className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-xs text-gray-400">{t('4 failles détectées — version gratuite', '4 issues found — free version')}</p>
                <div className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  {t('🔒 Détail des failles réservé à la version GARDIEN (5000 FCFA)', '🔒 Issue details reserved for the GARDIEN plan (5000 FCFA)')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 2 — Gardien */}
        {phase === 2 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-[#0066FF] font-mono text-xs uppercase tracking-wider">
              {t('2/3 — Débloquer le détail avec GARDIEN', '2/3 — Unlock details with GARDIEN')}
            </h3>

            {subStep < 3 && (
              <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-3">
                <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                  <Mail className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span className="font-mono text-sm text-white">{emailTyped}<span className="animate-pulse">|</span></span>
                </div>
                {subStep >= 1 && (
                  <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                    <Lock className="w-4 h-4 text-[#0066FF] shrink-0" />
                    <span className="font-mono text-sm text-white">{'•'.repeat(subStep >= 2 ? 10 : 0)}</span>
                  </div>
                )}
              </div>
            )}

            {subStep === 3 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#00FF88] animate-pulse" />
                <div>
                  <p className="text-white text-sm font-bold">{t('Paiement Mobile Money — 5000 FCFA', 'Mobile Money payment — 5000 FCFA')}</p>
                  <p className="text-gray-400 text-xs">{t('Confirmation en cours…', 'Confirming…')}</p>
                </div>
              </div>
            )}

            {subStep >= 4 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 space-y-3 animate-[fadeIn_0.4s_ease]">
                <div className="flex items-center gap-2 text-[#00FF88] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> {t('Accès GARDIEN débloqué', 'GARDIEN access unlocked')}
                </div>
                <ul className="text-xs text-gray-300 space-y-1 font-mono">
                  <li>⚠ HSTS manquant — {t('risque moyen', 'medium risk')}</li>
                  <li>⚠ Certificat SSL — {t('expire dans 12 jours', 'expires in 12 days')}</li>
                  <li>⚠ CSP absent — {t('risque élevé', 'high risk')}</li>
                  <li>⚠ Fichier .env exposé — {t('risque critique', 'critical risk')}</li>
                </ul>
                <p className="text-[11px] text-gray-500">
                  {t('3 domaines suivis automatiquement, surveillance continue.', '3 domains automatically monitored, continuous surveillance.')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3 — Portail développeurs */}
        {phase === 3 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-[#0066FF] font-mono text-xs uppercase tracking-wider">
              {t('3/3 — Rejoindre le portail développeurs', '3/3 — Join the developer portal')}
            </h3>

            <div className="glass-card rounded-2xl border border-[#0066FF]/40 p-4 space-y-3">
              <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                <User className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span className="font-mono text-sm text-white">{nameTyped}<span className="animate-pulse">|</span></span>
              </div>
              {subStep >= 1 && (
                <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                  <Smartphone className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span className="font-mono text-sm text-white">{waTyped}<span className="animate-pulse">|</span></span>
                </div>
              )}
              {subStep >= 2 && (
                <div className="flex items-center gap-2 bg-[#0A0A0F] rounded-xl border border-[#0066FF]/50 px-3 py-3">
                  <Globe className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span className="font-mono text-sm text-white">{portfolioTyped}<span className="animate-pulse">|</span></span>
                </div>
              )}
            </div>

            {subStep === 4 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 flex items-center gap-3 animate-[fadeIn_0.4s_ease]">
                <CreditCard className="w-6 h-6 text-[#00FF88] animate-pulse" />
                <div>
                  <p className="text-white text-sm font-bold">{t('Paiement Airtel Money — 5000 FCFA', 'Airtel Money payment — 5000 FCFA')}</p>
                  <p className="text-gray-400 text-xs">{t('Frais de candidature développeur', 'Developer application fee')}</p>
                </div>
              </div>
            )}

            {subStep >= 5 && (
              <div className="glass-card rounded-2xl border border-[#00FF88]/40 p-5 flex flex-col items-center text-center gap-2 animate-[fadeIn_0.4s_ease]">
                <Award className="w-10 h-10 text-[#00FF88]" />
                <p className="text-white font-display font-extrabold text-sm">GHULABE CERTIFIED</p>
                <p className="text-gray-400 text-xs">
                  {t('Après vérification d\'identité et test de compétences validés.', 'After identity verification and passed skills test.')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4 — Fin */}
        {phase === 4 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-5">
            <CheckCircle2 className="w-14 h-14 text-[#00FF88]" />
            <p className="text-white font-display font-bold text-base">
              {t('Démonstration terminée', 'Demo finished')}
            </p>
            <p className="text-gray-400 text-xs max-w-xs">
              {t('Ceci était une simulation à but pédagogique — aucune donnée réelle n\'a été créée.', 'This was an illustrative simulation — no real data was created.')}
            </p>
            <button
              onClick={replay}
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF]/15 border border-[#0066FF] text-[#0066FF] font-bold text-xs"
            >
              <RotateCcw className="w-4 h-4" /> {t('Revoir la démo', 'Watch again')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
