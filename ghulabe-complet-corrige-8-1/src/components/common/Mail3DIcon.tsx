import React from 'react';

interface Mail3DIconProps {
  size?: number;
}

// Enveloppe 3D animée (verre/métal, halo bleu néon) — remplace le badge "initiale du nom"
// dans le Header quand personne n'est connecté, pour inviter clairement à saisir email +
// mot de passe. Style volontairement dans l'identité visuelle GHULABE (bleu #0066FF / vert
// #00FF88), et non une reproduction du logo Gmail (marque déposée Google).
export const Mail3DIcon: React.FC<Mail3DIconProps> = ({ size = 26 }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0066FF] to-[#00FF88] opacity-60 blur-md animate-pulse rounded-full -z-10" />
      <svg viewBox="0 0 48 36" className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,102,255,0.65)]">
        <defs>
          <linearGradient id="envelopeBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8F1FF" />
            <stop offset="45%" stopColor="#9FC7FF" />
            <stop offset="100%" stopColor="#0047B3" />
          </linearGradient>
          <linearGradient id="envelopeFlap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#80C4FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
        {/* Corps de l'enveloppe */}
        <rect x="1" y="4" width="46" height="30" rx="4" fill="url(#envelopeBody)" stroke="#0047B3" strokeWidth="1.2" />
        {/* Rabat (effet 3D en relief) */}
        <path d="M 1 6 L 24 22 L 47 6" fill="none" stroke="url(#envelopeFlap)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Point de notification (nouveau message) */}
        <circle cx="40" cy="8" r="6" fill="#00FF88" stroke="#0A0A0F" strokeWidth="1.5" className="animate-pulse" />
      </svg>
    </div>
  );
};
