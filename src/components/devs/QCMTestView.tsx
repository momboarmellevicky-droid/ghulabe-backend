import React, { useState, useEffect } from 'react';
import { Language, QCMQuestion } from '../../types';
import { getT } from '../../data/i18n';
import { QCM_QUESTIONS } from '../../data/mockData';
import confetti from 'canvas-confetti';
import { 
  Clock, CheckCircle2, ShieldAlert, 
  Eye, AlertOctagon, Award
} from 'lucide-react';

interface QCMTestViewProps {
  lang: Language;
  candidateName: string;
  onFinishTest: (scorePercentage: number, passed: boolean, photos: string[]) => void;
  onCancelTest: (reason: string) => void;
}

export const QCMTestView: React.FC<QCMTestViewProps> = ({
  lang,
  candidateName,
  onFinishTest,
  onCancelTest
}) => {
  const t = getT(lang);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds per question
  const [photosTaken, setPhotosTaken] = useState<string[]>([]);
  const [facePresent, setFacePresent] = useState(true);
  const [testFinished, setTestFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Generate unique fake domain for each test session
  const [fakeDomain] = useState(() => {
    const prefixes = ['pay', 'bank', 'corp', 'portal', 'store', 'cloud', 'secure'];
    const suffixes = ['africa.sn', 'libreville.ga', 'dakar.sn', 'douala.cm', 'accra.gh', 'lagos.ng'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const rnd = Math.floor(100 + Math.random() * 900);
    return `auth-${p}-${rnd}-${s}`;
  });

  const currentQ: QCMQuestion = QCM_QUESTIONS[currentQIndex];

  // Timer per question (45s max)
  useEffect(() => {
    if (testFinished) return;

    setTimeLeft(45);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQIndex, testFinished]);

  // Silent random photo capture simulator (3 photos total)
  useEffect(() => {
    if (testFinished) return;
    const photoTimers = [8000, 22000, 38000].map((delay, idx) => {
      return setTimeout(() => {
        setPhotosTaken((prev) => [
          ...prev,
          `photo-${idx + 1}-${new Date().toLocaleTimeString()}`
        ]);
      }, delay);
    });

    return () => photoTimers.forEach(t => clearTimeout(t));
  }, [testFinished]);

  // Simulate occasional face check
  useEffect(() => {
    if (testFinished) return;
    const faceInterval = setInterval(() => {
      // 99% probability face is present during normal testing
      const isVisible = Math.random() > 0.01;
      setFacePresent(isVisible);
      if (!isVisible) {
        onCancelTest(lang === 'fr' 
          ? "ANNULATION AUTOMATISÉE : Visage absent de la webcam pendant le test technique."
          : "AUTOMATED CANCELLATION: Face absent from webcam surveillance during technical test."
        );
      }
    }, 4000);

    return () => clearInterval(faceInterval);
  }, [testFinished]);

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optIndex
    });
  };

  const handleNextQuestion = () => {
    if (currentQIndex < QCM_QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      finishAndGradeTest();
    }
  };

  const finishAndGradeTest = () => {
    setTestFinished(true);
    let correctCount = 0;
    QCM_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const pct = Math.round((correctCount / QCM_QUESTIONS.length) * 100);
    setFinalScore(pct);
    const passed = pct >= 70;

    if (passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      }
    }

    onFinishTest(pct, passed, photosTaken);
  };

  const severityBadge = (text: string) => {
    if (text.includes('Critique') || text.includes('Critical')) {
      return <span className="px-2 py-0.5 rounded bg-[#FF2D2D]/20 text-[#FF2D2D] border border-[#FF2D2D]/40 text-xs font-mono font-bold ml-2">🔴 Critique</span>;
    }
    if (text.includes('Élevé') || text.includes('High')) {
      return <span className="px-2 py-0.5 rounded bg-[#FF6B2D]/20 text-[#FF6B2D] border border-[#FF6B2D]/40 text-xs font-mono font-bold ml-2">🟠 Élevé</span>;
    }
    if (text.includes('Moyen') || text.includes('Medium')) {
      return <span className="px-2 py-0.5 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 text-xs font-mono font-bold ml-2">🟡 Moyen</span>;
    }
    if (text.includes('Faible') || text.includes('Low')) {
      return <span className="px-2 py-0.5 rounded bg-[#0066FF]/20 text-[#4DA8FF] border border-[#0066FF]/40 text-xs font-mono font-bold ml-2">🔵 Faible</span>;
    }
    return null;
  };

  if (testFinished) {
    const passed = finalScore >= 70;
    const isSuspicious = finalScore === 100;

    return (
      <div className="glass-card max-w-2xl mx-auto p-4 sm:p-8 rounded-3xl border text-center space-y-4 sm:space-y-6 animate-fade-in border-[#0066FF]">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-[#0D1B2A] border-2 border-[#0066FF]">
          {passed ? (
            <Award className="w-10 h-10 text-[#00FF88]" />
          ) : (
            <AlertOctagon className="w-10 h-10 text-[#FF2D2D]" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
            {passed ? (lang === 'fr' ? "Félicitations ! Test Réussi" : "Congratulations! Test Passed") : (lang === 'fr' ? "Test Échoué (< 70%)" : "Test Failed (< 70%)")}
          </h2>
          <p className="text-3xl font-display font-bold text-[#00FF88]">
            Score Final : {finalScore}% ({Math.round((finalScore / 100) * 30)}/30)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0A0A0F] border border-white/10 text-xs font-mono text-gray-300 space-y-2 text-left">
          <p>🧑‍💻 Candidat : <strong className="text-white">{candidateName}</strong></p>
          <p>🌐 Rapport simulé : <span className="text-[#80C4FF]">{fakeDomain}</span></p>
          <p>📸 Photos de surveillance silencieuses : <strong className="text-[#00FF88]">{photosTaken.length || 3} prises</strong></p>
          {isSuspicious && (
            <p className="p-2 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-bold">
              ⚠️ Alerte de Sécurité : Score parfait de 100%. Statut signalé pour vérification manuelle par Mombo Armelle Vicky.
            </p>
          )}
        </div>

        {!passed && (
          <div className="p-5 rounded-2xl bg-[#FF2D2D]/10 border border-[#FF2D2D]/40 text-xs text-gray-300 space-y-2">
            <p className="text-[#FF2D2D] font-bold uppercase tracking-wider">Règles de Nouvelle Tentative</p>
            <p>Conformément au protocole de certification GHULABE, vous devez attendre <strong>30 jours</strong> et vous acquitter de frais de réessai de <strong>2 500 FCFA</strong> pour vous présenter à nouveau.</p>
          </div>
        )}

        {passed && (
          <div className="p-5 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/40 text-xs text-gray-200 space-y-2">
            <p className="text-[#00FF88] font-bold uppercase tracking-wider">Badge : GHULABE RECRUIT Attribué</p>
            <p>Votre profil est désormais actif. Vous percevrez <strong>85% net</strong> sur toutes vos interventions de correction de failles auprès des PME africaines.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Top Test Banner & Webcam Box */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[#0066FF]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          
          {/* Webcam Simulator Box */}
          <div className="relative w-16 h-12 bg-[#0A0A0F] rounded-lg border-2 border-[#00FF88] overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,255,136,0.4)]">
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${facePresent ? 'bg-[#FF2D2D]' : 'bg-[#FFB800]'} animate-ping`}></div>
            <Eye className="w-5 h-5 text-[#00FF88]" />
            <span className="absolute bottom-0.5 inset-x-0 bg-black/80 text-[8px] text-center font-mono text-[#00FF88]">
              REC LIVE
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">Rapport d'épreuve :</span>
              <code className="text-xs font-mono text-[#00FF88] font-bold">{fakeDomain}</code>
            </div>
            <p className="text-sm font-display font-bold text-white mt-0.5">
              Question {currentQIndex + 1} / 30 • {lang === 'fr' ? currentQ.blockTitleFr : currentQ.blockTitleEn}
            </p>
          </div>
        </div>

        {/* 45s Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-black border ${
          timeLeft <= 10 ? 'bg-[#FF2D2D] text-white border-white animate-bounce' : 'bg-[#0D1B2A] text-[#FFB800] border-[#FFB800]/40'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s max</span>
        </div>
      </div>

      {/* ANTI-SCREENSHOT WARNING */}
      <div className="p-3 rounded-xl bg-[#FF6B2D]/15 border border-[#FF6B2D]/40 text-xs text-[#FF6B2D] font-mono flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>{t.screenshotWarning}</span>
      </div>

      {/* Question Card */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4 sm:space-y-6 bg-[#0A0A0F]">
        <div className="space-y-3">
          <span className="px-2.5 py-1 rounded bg-[#0066FF]/20 text-[#80C4FF] font-mono text-xs font-bold">
            BLOC {currentQ.block}
          </span>
          <h3 className="text-lg sm:text-2xl font-display font-bold text-white leading-relaxed flex items-center flex-wrap">
            <span>{lang === 'fr' ? currentQ.questionFr : currentQ.questionEn}</span>
            {severityBadge(currentQ.questionFr)}
          </h3>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-4 pt-4">
          {(lang === 'fr' ? currentQ.optionsFr : currentQ.optionsEn).map((optTxt, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between font-mono text-xs sm:text-sm border ${
                  isSelected
                    ? 'bg-[#0066FF] text-white border-white shadow-[0_0_20px_rgba(0,102,255,0.6)] font-bold'
                    : 'bg-[#0D1B2A]/70 text-gray-300 border-white/5 hover:border-[#0066FF]/40 hover:bg-[#0D1B2A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? 'bg-white text-[#0066FF]' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{optTxt}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Next CTA */}
        <div className="flex justify-end pt-6 border-t border-white/5">
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQ.id] === undefined}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00CC6A] hover:from-[#00CC6A] hover:to-[#00994D] text-[#0A0A0F] font-display font-extrabold text-sm uppercase transition-all shadow-[0_0_20px_rgba(0,255,136,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQIndex === QCM_QUESTIONS.length - 1 ? (lang === 'fr' ? "Valider le Test (30/30)" : "Submit Final Test") : (lang === 'fr' ? "Question Suivante (45s)" : "Next Question")}
          </button>
        </div>
      </div>

    </div>
  );
};
    
