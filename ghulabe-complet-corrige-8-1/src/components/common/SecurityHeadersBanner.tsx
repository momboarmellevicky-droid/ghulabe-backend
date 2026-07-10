import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export const SecurityHeadersBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#0D1B2A] border-b border-[#0066FF]/30 px-4 py-1.5 text-xs text-gray-300 font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
          <span className="font-semibold text-white">GHULABE SecOps Engine Active</span>
          <span className="hidden md:inline text-gray-400">| Rate Limiting Strict & TLS 1.3 en transit</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-[11px] text-[#0066FF] hover:text-[#4DA8FF] cursor-pointer transition-colors"
        >
          <span>{isOpen ? "Masquer En-têtes HTTP Live" : "Inspecter En-têtes HTTP de Sécurité Live"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-2.5 p-3 rounded-lg bg-[#0A0A0F] border border-[#0066FF]/40 text-[11px] space-y-2 text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-2 rounded bg-[#0D1B2A]/80 border border-[#00FF88]/30">
              <CheckCircle2 className="w-4 h-4 text-[#00FF88] mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-white">Strict-Transport-Security (HSTS)</p>
                <code className="text-[#00FF88] block mt-0.5 break-all text-[10px]">max-age=31536000; includeSubDomains; preload</code>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded bg-[#0D1B2A]/80 border border-[#0066FF]/30">
              <CheckCircle2 className="w-4 h-4 text-[#0066FF] mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-white">Content-Security-Policy (CSP)</p>
                <code className="text-[#80C4FF] block mt-0.5 break-all text-[10px]">default-src 'self' https: ghulabe.com; script-src 'self' 'unsafe-inline'</code>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded bg-[#0D1B2A]/80 border border-[#FFB800]/30">
              <CheckCircle2 className="w-4 h-4 text-[#FFB800] mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-white">X-Frame-Options & CORS</p>
                <code className="text-[#FFB800] block mt-0.5 break-all text-[10px]">X-Frame-Options: DENY | Access-Control-Allow-Origin: https://ghulabe.com</code>
              </div>
            </div>
          </div>
          <div className="pt-1 flex items-center justify-between border-t border-white/5 text-gray-400 text-[10px]">
            <span>Chiffrement au repos : <strong className="text-white">AES-256</strong></span>
            <span>Hébergement : <strong className="text-[#00FF88]">Render (UE/Frankfurt)</strong></span>
            <span>Rate Limiting : <strong className="text-[#FF2D2D]">100 req/min/IP</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
