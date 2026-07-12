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
