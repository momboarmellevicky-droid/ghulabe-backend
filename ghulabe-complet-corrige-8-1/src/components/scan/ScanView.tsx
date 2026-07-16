import React, { useState, useEffect } from 'react';
import { Language, ScanResult, TabType } from '../../types';
import { getT } from '../../data/i18n';
import { GhulabeBackend } from '../../services/apiClient';
import {
  Terminal, AlertOctagon, CheckSquare, Square, CheckCircle2,
  Copy, Check, FileDown, Lock, Code2, Cpu, Globe,
  UserCheck
} from 'lucide-react';

interface ScanViewProps {
  lang: Language;
  initialUrl?: string;
  initialScanActive?: boolean;
  accessToken?: string;
  onScanComplete?: (res: ScanResult) => void;
  setActiveTab: (tab: TabType) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  lang,
  initialUrl = '',
  initialScanActive = false,
  accessToken,
  onScanComplete,
  setActiveTab
}) => {
  const t = getT(lang);

  const [url, setUrl] = useState(initialUrl);
  const [consentChecked, setConsentChecked] = useState(initialScanActive);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(initialScanActive);
  const [scanStep, setScanStep] = useState(1);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeReportTab, setActiveReportTab] = useState<'ceo' | 'dev'>('ceo');
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialScanActive && initialUrl) {
      setConsentChecked(true);
      startScanProcess(initialUrl);
    }
  }, [initialUrl, initialScanActive]);

  const startScanProcess = async (targetUrl: string) => {
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(5);
    setCurrentResult(null);
    setErrorMsg('');

    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 900);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 6 : prev));
    }, 300);

    try {
      // Appel réel au backend GHULABE (moteur Nuclei + Nmap + SSL Labs API).
      // Plus aucune donnée simulée : le score, le temps de scan et les failles
      // renvoyés varient réellement selon le domaine scanné.
      const result = await GhulabeBackend.startScan(targetUrl, consentChecked, accessToken);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      setScanStep(5);
      setScanProgress(100);
      setIsScanning(false);
      setCurrentResult(result);
      if (onScanComplete) onScanComplete(result);
    } catch (err: any) {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      setIsScanning(false);
      setScanProgress(0);
      setErrorMsg(
        err.message ||
        (lang === 'fr' ? 'Erreur lors du scan.' : 'Scan failed.')
      );
    }
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
    if (!currentResult?.report_pdf_url) return;
    setIsDownloadingPdf(true);
    window.open(currentResult.report_pdf_url, '_blank');
    setTimeout(() => {
      setIsDownloadingPdf(false);
    }, 800);
  };

  const criticalCount = currentResult?.findings?.filter((f) => f.severity === 'critique').length ?? 0;
  const highCount = currentResult?.findings?.filter((f) => f.severity === 'eleve').length ?? 0;

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
