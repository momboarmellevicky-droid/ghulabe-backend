import React from 'react';
import { Language } from '../../types';
import { getT } from '../../data/i18n';
import { Logo3DEye } from './Logo3DEye';
import { ShieldAlert, Server, Lock, FileCheck } from 'lucide-react';

interface FooterProps {
  lang: Language;
  onOpenLegal: (page: 'mentions' | 'privacy' | 'cgu' | 'disclaimer' | 'cookies') => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenLegal }) => {
  const t = getT(lang);

  return (
    <footer className="bg-[#0A0A0F] border-t border-[#0066FF]/30 pt-4 pb-16 md:pb-6 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b border-white/5">
          
          {/* Col 1: Brand & Eye */}
          <div className="flex flex-col items-start gap-4 md:col-span-1">
            <Logo3DEye size="sm" showText={true} />
            <p className="text-xs text-gray-300 font-mono leading-relaxed">
              {t.tagline}
            </p>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1B2A] border border-[#0066FF]/30 text-[11px] text-[#00FF88] font-mono">
              <Server className="w-3.5 h-3.5" />
              <span>{t.hostingBadge}</span>
            </div>
          </div>

          {/* Col 2: Legal Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-1">
              Conformité & Juridique
            </h4>
            <button
              onClick={() => onOpenLegal('mentions')}
              className="text-left text-xs hover:text-[#0066FF] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>{t.legalLinks.mentions}</span>
            </button>
            <button
              onClick={() => onOpenLegal('privacy')}
              className="text-left text-xs hover:text-[#0066FF] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#00FF88]" />
              <span>{t.legalLinks.privacy}</span>
            </button>
            <button
              onClick={() => onOpenLegal('cgu')}
              className="text-left text-xs hover:text-[#0066FF] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>{t.legalLinks.cgu}</span>
            </button>
            <button
              onClick={() => onOpenLegal('disclaimer')}
              className="text-left text-xs hover:text-[#0066FF] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#FF6B2D]" />
              <span>{t.legalLinks.disclaimer}</span>
            </button>
            <button
              onClick={() => onOpenLegal('cookies')}
              className="text-left text-xs hover:text-[#0066FF] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>{t.legalLinks.cookies}</span>
            </button>
          </div>

          {/* Col 3: Stack & Engine Info */}
          <div className="flex flex-col gap-2 text-xs font-mono">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-1 font-sans">
              Architecture Sécurité
            </h4>
            <p className="text-gray-400">⚡ Engine : Nuclei + Nmap</p>
            <p className="text-gray-400">🛡️ Chiffrement : AES-256 / TLS 1.3</p>
            <p className="text-gray-400">🗄️ Stack : React / Node / PostgreSQL / Redis</p>
            <p className="text-[#00FF88]">🌐 Déploiement : GitHub ➔ Render</p>
          </div>

          {/* Col 4: Slogans */}
          <div className="flex flex-col gap-3 md:col-span-1 bg-[#0D1B2A]/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase">
              Slogans Officiels
            </h4>
            <p className="text-xs text-gray-300 font-display italic">
              "Une URL. Un scan. Zéro faille cachée."
            </p>
            <p className="text-xs text-gray-400 font-mono tracking-wide">
              "One URL. One scan. Zero hidden vulnerability."
            </p>
          </div>

        </div>

        {/* Mandatory Exact Footer Text block */}
        <div className="mt-4 text-center flex flex-col items-center justify-center gap-1 py-3 bg-[#0D1B2A]/70 rounded-xl border border-[#0066FF]/40 shadow-[0_0_20px_rgba(0,102,255,0.15)]">
          <p className="text-sm font-display font-bold text-white tracking-wide">
            © 2026 GHULABE — Tous droits réservés
          </p>
          <p className="text-xs font-medium text-white">
            Créée par Mombo Armelle Vicky
          </p>
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Protection OAPI en cours — Toute reproduction interdite
          </p>
        </div>
      </div>
    </footer>
  );
};
