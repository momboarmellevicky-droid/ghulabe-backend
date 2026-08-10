import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Language } from '../../types';

// ============================================================================
// GHULABE — SUPPORT HUMAIN
// Bouton flottant visible sur toutes les vues, ouvre une conversation
// WhatsApp directe avec le support. Donne aux utilisateurs le sentiment
// concret qu'un humain traite leur cas, pas juste un outil automatisé.
// ============================================================================

const SUPPORT_WHATSAPP_E164 = '+24177580213';

interface SupportButtonProps {
  lang: Language;
}

export const SupportButton: React.FC<SupportButtonProps> = ({ lang }) => {
  const [open, setOpen] = useState(false);

  const message = lang === 'fr'
    ? "Bonjour, j'ai besoin d'aide concernant GHULABE."
    : "Hello, I need help regarding GHULABE.";

  const waLink = `https://wa.me/${SUPPORT_WHATSAPP_E164.replace('+', '')}?text=${encodeURIComponent(message)}`;

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-[9998] w-64 rounded-2xl bg-[#0D1B2A] border border-[#00FF88]/40 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-white font-display font-bold text-sm mb-1">
            {lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}
          </p>
          <p className="text-gray-300 text-xs mb-3 leading-relaxed">
            {lang === 'fr'
              ? 'Notre équipe répond directement sur WhatsApp, en général en quelques minutes.'
              : 'Our team replies directly on WhatsApp, usually within minutes.'}
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00FF88] text-[#0A0A0F] font-bold text-sm hover:brightness-95 transition"
          >
            <MessageCircle className="w-4 h-4" />
            {lang === 'fr' ? 'Discuter sur WhatsApp' : 'Chat on WhatsApp'}
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-[#00FF88] shadow-lg shadow-[#00FF88]/30 flex items-center justify-center hover:scale-105 transition-transform"
        style={{ display: open ? 'none' : 'flex' }}
        aria-label={lang === 'fr' ? 'Support' : 'Support'}
      >
        <MessageCircle className="w-6 h-6 text-[#0A0A0F]" />
      </button>
    </>
  );
};
