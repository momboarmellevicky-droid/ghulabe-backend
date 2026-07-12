import React, { useState, useEffect } from 'react';
import { Language, ScanResult, TabType } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_SAMPLE_SCAN } from '../../data/mockData';
import { 
  Terminal, AlertOctagon, CheckSquare, Square, CheckCircle2, 
  Copy, Check, FileDown, Lock, Code2, Cpu, Globe, 
  UserCheck
} from 'lucide-react';

interface ScanViewProps {
  lang: Language;
  initialUrl?: string;
  initialScanActive?: boolean;
  onScanComplete?: (res: ScanResult) => void;
  setActiveTab: (tab: TabType) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  lang,
  initialUrl = '',
  initialScanActive = false,
  onScanComplete,
  setActiveTab
}) => {
  const t = getT(lang);

  const [url, setUrl] = useState(initialUrl || 'ebanking-pme-africa.sn');
  const [consentChecked, setConsentChecked] = useState(initialScanActive);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(initialScanActive);
  const [scanStep, setScanStep] = useState(1);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeReportTab, setActiveReportTab] = useState<'ceo' | 'dev'>('ceo');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(
    initialScanActive ? null : MOCK_SAMPLE_SCAN
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialScanActive) {
      setConsentChecked(true);
      startScanProcess(initialUrl || 'ebanking-pme-africa.sn');
    }
  }, [initialUrl, initialScanActive]);

  const startScanProcess = (targetUrl: string) => {
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(5);
    setCurrentResult(null);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 900);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(stepInterval);
          setIsScanning(false);
          const mockRes: ScanResult = {
            ...MOCK_SAMPLE_SCAN,
            id: `scan-${Date.now()}`,
            url: targetUrl || 'ebanking-pme-africa.sn',
            created_at: new Date().toISOString()
          };
          setCurrentResult(mockRes);
          if (onScanComplete) onScanComplete(mockRes);
          return 100;
        }
        return prev + 6;
      });
    }, 300);
  };

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setErrorMsg(t.scanConsentError);
      return;
    }
    if (!url || !url.includes('.')) {
      setErrorMsg(lang === 'fr' ? "Veuillez entrer un domaine valide (ex: masociete.com)" : "Please enter a valid domain (e.g. mycompany.com)");
      return;
    }
    setErrorMsg('');
    startScanProcess(url);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      setIsDownloadingPdf(false);
      alert(lang === 'fr' 
        ? "📄 Rapport d'Audit PDF officiel généré avec succès !\n\nFiligrane confidentiel : CONFIDENTIAL — GHULABE PME AFRICA\nSignature légale certifiée : Mombo Armelle Vicky © 2026"
        : "📄 Official Signed PDF Audit Report downloaded!\n\nConfidential Watermark: CONFIDENTIAL — GHULABE PME AFRICA\nCertified Legal Signature: Mombo Armelle Vicky © 2026"
      );
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-12">
      
      {/* Scanner Control Header & Consent Box */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/40 shadow-[0_0_35px_rgba(0,102,255,0.15)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
          <div>
            <span className="px-2.5 py-1 rounded bg-[#0066FF]/20 text-[#0066FF] font-mono text-xs font-bold uppercase tracking-wider">
              Scan Externe Sans Accès Interne (&lt; 60s)
            </span>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mt-2">
              {lang === 'fr' ? "Moteur de Diagnostic Cybersécurité" : "Cybersecurity Diagnostic Engine"}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-[#0A0A0F] px-3 py-2 rounded-xl border border-white/5">
            <Cpu className="w-4 h-4 text-[#00FF88]" />
            <span>Nuclei + Nmap + SSL Labs API</span>
          </div>
        </div>

        <form onSubmit={handleStartScan} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0066FF]" />
              <input
                type="text"
                value={url}
                disabled={isScanning}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={t.urlInputPlaceholder}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/40 text-white font-mono text-sm focus:border-[#00FF88] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-[#0066FF] via-[#005CE6] to-[#004CDA] hover:from-[#00FF88] hover:to-[#00CC6A] hover:text-[#0A0A0F] text-white font-display font-extrabold text-sm sm:text-base uppercase transition-all shadow-[0_0_20px_rgba(0,102,255,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 border border-[#80C4FF]/30"
            >
              <Terminal className="w-5 h-5" />
              <span>{isScanning ? (lang === 'fr' ? "SCAN EN COURS..." : "SCANNING...") : t.startScanBtn}</span>
            </button>
          </div>

          {/* ACCORD OBLIGATOIRE CASE À COCHER (CRITICAL REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#0066FF]/30 text-left">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div
                onClick={() => {
                  if (!isScanning) {
                    setConsentChecked(!consentChecked);
                    if (errorMsg) setErrorMsg('');
                  }
                }}
                className="mt-0.5 shrink-0"
              >
                {consentChecked ? (
                  <CheckSquare className="w-5 h-5 text-[#00FF88]" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 group-hover:text-[#0066FF]" />
                )}
              </div>
              <div className="text-xs text-gray-300 font-sans leading-relaxed">
                <strong className="text-[#FFB800] block mb-1 uppercase font-mono text-[11px]">
                  {lang === 'fr' ? "Accord Obligatoire avant tout scan" : "Mandatory agreement before scan"}
                </strong>
                {t.scanConsentLabel}
              </div>
            </label>
            {errorMsg && (
              <div className="mt-3 p-2.5 rounded bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-xs text-[#FF2D2D] font-bold flex items-center gap-2 animate-pulse">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* SCANNING SIMULATOR (< 60s animation) */}
      {isScanning && (
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-[#0066FF] shadow-[0_0_40px_rgba(0,102,255,0.4)] text-center max-w-4xl mx-auto animate-pulse-neon">
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#0066FF]/20 animate-ping"></div>
            <div className="w-16 h-16 rounded-full bg-[#0066FF] flex items-center justify-center shadow-[0_0_25px_#0066FF]">
              <Terminal className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-wide">
            {t.scanningTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 font-mono">
            Cible : <strong className="text-[#00FF88]">{url}</strong> — {t.scanningSub}
          </p>

          {/* Progress Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="w-full h-3 bg-[#0A0A0F] rounded-full overflow-hidden p-0.5 border border-[#0066FF]/40">
              <div
                className="h-full bg-gradient-to-r from-[#0066FF] via-[#00FF88] to-[#0066FF] rounded-full transition-all duration-300 shadow-[0_0_10px_#00FF88]"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs font-mono text-gray-400">
              <span>Moteur : Nuclei / SSL / Nmap</span>
              <span className="text-[#00FF88] font-bold">{scanProgress}%</span>
            </div>
          </div>

          {/* Step checklist */}
          <div className="mt-8 text-left max-w-xl mx-auto space-y-3 bg-[#0A0A0F]/80 p-5 rounded-2xl border border-white/5 text-xs font-mono">
            {[t.scanStep1, t.scanStep2, t.scanStep3, t.scanStep4, t.scanStep5].map((stepTxt, i) => {
              const stepNum = i + 1;
              const isDone = scanStep > stepNum;
              const isCurrent = scanStep === stepNum;
              return (
                <div key={i} className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00FF88] shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-t-[#0066FF] border-r-[#0066FF] border-b-transparent border-l-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-800 shrink-0"></div>
                  )}
                  <span className={isDone ? 'text-gray-300' : isCurrent ? 'text-white font-bold' : 'text-gray-600'}>
                    [{stepNum}/5] {stepTxt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPLETED REPORT VIEW (TWO MANDATORY TABS) */}
      {!isScanning && currentResult && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          
          {/* Score overview & Download PDF Header */}
          <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[#0066FF]/50 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              
              {/* Score Circle */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0A0A0F] border-2 border-[#FF2D2D] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,45,45,0.4)] shrink-0">
                <span className="text-3xl sm:text-4xl font-display font-black text-[#FF2D2D]">
                  {currentResult.score}
                </span>
                <span className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tight">/ 10 SCORE</span>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#FF2D2D]/20 text-[#FF2D2D] border border-[#FF2D2D]/40 font-bold">
                    🔴 2 Failles Critiques
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FF6B2D]/20 text-[#FF6B2D] border border-[#FF6B2D]/40 font-bold">
                    🟠 1 Élevée
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-display font-bold text-white">
                  Rapport externe : <span className="text-[#00FF88]">{currentResult.url}</span>
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  Temps de scan : <strong className="text-white">{currentResult.scan_duration_seconds}s</strong> • Fichiers exposés : <span className="text-[#FF2D2D]">{currentResult.exposed_files.join(', ')}</span>
                </p>
              </div>

            </div>

            {/* DOWNLOAD SIGNED PDF CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00CC6A] hover:from-[#00CC6A] hover:to-[#00994D] text-[#0A0A0F] font-display font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all cursor-pointer border border-white/20"
              >
                <FileDown className="w-5 h-5" />
                <span>{isDownloadingPdf ? "Génération PDF..." : t.downloadPdf}</span>
              </button>

              <button
                onClick={() => setActiveTab('devs')}
                className="w-full sm:w-auto px-5 py-4 rounded-xl bg-[#0D1B2A] hover:bg-[#0066FF]/30 text-white font-display font-bold text-sm flex items-center justify-center gap-2 border border-[#0066FF]/50 transition-colors cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-[#0066FF]" />
                <span>{lang === 'fr' ? "Missionner un Dev Certifié" : "Hire Certified Dev"}</span>
              </button>
            </div>
          </div>

          {/* TWO MANDATORY REPORT TABS SWITCHER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0D1B2A] p-2 rounded-2xl border border-white/10">
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[480px]">
              <button
                onClick={() => setActiveReportTab('ceo')}
                className={`py-3 px-6 rounded-xl font-display font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  activeReportTab === 'ceo'
                    ? 'bg-[#0066FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.6)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>👔</span>
                <span>{t.tabCeo}</span>
              </button>

              <button
                onClick={() => setActiveReportTab('dev')}
                className={`py-3 px-6 rounded-xl font-display font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  activeReportTab === 'dev'
                    ? 'bg-[#00FF88] text-[#0A0A0F] shadow-[0_0_20px_rgba(0,255,136,0.6)] font-extrabold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>{t.tabDev}</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0A0A0F] text-xs text-gray-400 font-mono">
              <Lock className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Chaque faille contient son correctif copier-coller exclusif</span>
            </div>
          </div>

          {/* TAB 1: POUR LE PATRON / FOR THE CEO */}
          {activeReportTab === 'ceo' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#0D1B2A]/60 border border-[#0066FF]/30 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-lg sm:text-xl text-white">
                    {t.ceoSectionTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 font-sans">
                    {lang === 'fr' 
                      ? "Langage clair sans acronymes techniques pour comprendre l'impact financier, légal et la réputation de votre PME."
                      : "Clear non-technical language explaining the financial risk, legal exposure, and reputation impact on your business."
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {currentResult.findings.map((finding) => (
                  <div 
                    key={finding.id}
                    className={`glass-card rounded-2xl p-6 sm:p-8 border space-y-6 ${
                      finding.severity === 'critique' ? 'border-[#FF2D2D]/60 bg-[#FF2D2D]/5' :
                      finding.severity === 'eleve' ? 'border-[#FF6B2D]/60 bg-[#FF6B2D]/5' :
                      finding.severity === 'moyen' ? 'border-[#FFB800]/60 bg-[#FFB800]/5' : 'border-[#0066FF]/50 bg-[#0066FF]/5'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {finding.severity === 'critique' ? '🔴' : finding.severity === 'eleve' ? '🟠' : finding.severity === 'moyen' ? '🟡' : '🔵'}
                        </span>
                        <h4 className="font-display font-bold text-lg sm:text-xl text-white">
                          {lang === 'fr' ? finding.title_fr : finding.title_en}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#0A0A0F] text-xs font-mono uppercase tracking-wider text-gray-300 border border-white/10 shrink-0">
                        {finding.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="p-4 rounded-xl bg-[#0A0A0F]/80 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          {lang === 'fr' ? "💼 Impact Business" : "💼 Business Impact"}
                        </span>
                        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                          {lang === 'fr' ? finding.ceo_impact_fr : finding.ceo_impact_en}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0A0A0F]/80 border border-white/5 space-y-1">
                        <span className="text-[10px] font-mono text-[#FFB800] uppercase tracking-wider block">
                          {lang === 'fr' ? "⚖️ Risque Financier & Légal" : "⚖️ Financial & Legal Risk"}
                        </span>
                        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans font-medium">
                          {lang === 'fr' ? finding.financial_risk_fr : finding.financial
