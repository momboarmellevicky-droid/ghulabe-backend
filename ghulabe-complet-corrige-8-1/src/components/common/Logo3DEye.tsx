import React from 'react';
import { Language } from '../../types';

interface Logo3DEyeProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  showSlogan?: boolean;
  lang?: Language;
}

export const Logo3DEye: React.FC<Logo3DEyeProps> = ({
  size = 'md',
  showText = true,
  showSlogan = false,
  lang = 'fr'
}) => {
  // Map dimensions for the 3D Open Eye (almond wide-open eye ratio)
  const eyeContainerSize = {
    sm: 'w-10 h-6',
    md: 'w-14 h-8',
    lg: 'w-20 h-12',
    hero: 'w-36 h-20 sm:w-48 sm:h-28 md:w-56 md:h-32'
  }[size];

  // Map typography size for GHULABE placed underneath
  const textSize = {
    sm: 'text-xs tracking-wider mt-1.5',
    md: 'text-sm sm:text-base font-black tracking-widest mt-2',
    lg: 'text-lg sm:text-xl font-black tracking-widest mt-2.5',
    hero: 'text-3xl sm:text-5xl md:text-6xl tracking-wider mt-5 sm:mt-7'
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none group cursor-pointer ${size === 'hero' ? 'my-2' : ''}`}>
      
      {/* 3D Hyper-realistic Open Eye (Œil ouvert en 3D) */}
      <div className={`relative ${eyeContainerSize} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}>
        
        {/* Outer Neon Blue Halo Glow behind the Open Eye */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0066FF] via-[#00FF88] to-[#0066FF] opacity-35 blur-xl group-hover:opacity-65 transition-opacity duration-500 rounded-full -z-10"></div>

        <svg
          viewBox="0 0 100 60"
          className="w-full h-full overflow-visible drop-shadow-[0_0_18px_rgba(0,102,255,0.6)]"
        >
          <defs>
            {/* Metallic Silver Eyelid Gradient */}
            <linearGradient id="metallicSilver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4B5563" />
              <stop offset="25%" stopColor="#D1D5DB" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#1F2937" />
            </linearGradient>

            {/* Neon Blue Halo behind Iris */}
            <radialGradient id="neonBlueHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4DA8FF" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0066FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
            </radialGradient>

            {/* 3D Electric Blue Iris (#0066FF) */}
            <radialGradient id="iris3D" cx="42%" cy="38%" r="55%">
              <stop offset="0%" stopColor="#80C4FF" />
              <stop offset="35%" stopColor="#0066FF" />
              <stop offset="75%" stopColor="#003380" />
              <stop offset="100%" stopColor="#001433" />
            </radialGradient>

            {/* Deep Black Pupil */}
            <radialGradient id="pupil3D" cx="45%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#1A1A24" />
              <stop offset="80%" stopColor="#0A0A0F" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Sclera Inner Shadow */}
            <radialGradient id="scleraShadow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#0A0A0F" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
            </radialGradient>
          </defs>

          {/* 1. Open Eye Outer Contour & Metallic Silver Eyelid */}
          <path
            d="M 4 30 C 22 2, 78 2, 96 30 C 78 58, 22 58, 4 30 Z"
            fill="#0A0A0F"
            stroke="url(#metallicSilver)"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />

          {/* Sclera inner depth shading */}
          <path
            d="M 6 30 C 23 5, 77 5, 94 30 C 77 55, 23 55, 6 30 Z"
            fill="url(#scleraShadow)"
          />

          {/* 2. Neon Blue Halo inside eye */}
          <ellipse
            cx="50"
            cy="30"
            rx="23"
            ry="23"
            fill="url(#neonBlueHalo)"
            className="animate-pulse"
          />

          {/* 3. 3D Electric Blue Iris */}
          <circle
            cx="50"
            cy="30"
            r="17.5"
            fill="url(#iris3D)"
            stroke="#4DA8FF"
            strokeWidth="0.6"
          />

          {/* Iris cyber texture fibrils */}
          <circle
            cx="50"
            cy="30"
            r="9.5"
            fill="none"
            stroke="#80C4FF"
            strokeWidth="0.3"
            strokeDasharray="1 1"
            opacity="0.5"
          />

          {/* 4. Deep Black Pupil */}
          <circle
            cx="50"
            cy="30"
            r="7.5"
            fill="url(#pupil3D)"
            stroke="#004DA8"
            strokeWidth="0.5"
          />

          {/* 5. Cyber Specular Highlights (Effet 3D hyper-réaliste) */}
          <circle
            cx="44.5"
            cy="24.5"
            r="2.4"
            fill="#FFFFFF"
            opacity="0.95"
            filter="drop-shadow(0 0 1.5px white)"
          />
          <circle
            cx="54.5"
            cy="33.5"
            r="1.1"
            fill="#80C4FF"
            opacity="0.75"
          />

          {/* 6. Cyber Scan Laser Line across open eye */}
          <line
            x1="8"
            y1="30"
            x2="92"
            y2="30"
            stroke="#00FF88"
            strokeWidth="0.7"
            strokeDasharray="4 2"
            opacity="0.8"
            className="animate-scan-laser"
          />
        </svg>

      </div>

      {/* Nom placé EN DESSOUS (Space Grotesk Bold) */}
      {showText && (
        <div className="flex flex-col items-center justify-center text-center">
          <span className={`font-display font-extrabold ${textSize} text-[#FFFFFF] uppercase tracking-tight block drop-shadow-[0_2px_12px_rgba(0,102,255,0.7)]`}>
            GHULABE
          </span>
        </div>
      )}

      {/* Slogan placé EN DESSOUS selon la langue active */}
      {showSlogan && (
        <div className="mt-4 text-center">
          <p className="text-sm sm:text-lg font-display font-bold text-gray-200 tracking-wide border-l-2 border-[#0066FF] pl-3 py-1 bg-gradient-to-r from-[#0D1B2A]/90 to-transparent inline-block rounded-r">
            {lang === 'en' 
              ? '"One URL. One scan. Zero hidden vulnerability."'
              : '"Une URL. Un scan. Zéro faille cachée."'
            }
          </p>
        </div>
      )}

    </div>
  );
};
