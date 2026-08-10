import React from 'react';
import { Developer } from '../../types';

interface AfricaMapProps {
  developers: Developer[];
  onSelectDeveloper: (dev: Developer) => void;
  selectedCountry?: string;
}

// Villes de la zone CFA (CEMAC — franc XAF, et UEMOA — franc XOF).
// Ce sont les pays où le paiement Mobile Money local (Airtel Money, Moov Money
// et équivalents) est le plus pertinent pour GHULABE.
const CFA_ZONE_NODES = [
  // CEMAC (XAF)
  { name: 'Libreville', country: 'Gabon', x: 54, y: 58 },
  { name: 'Douala', country: 'Cameroun', x: 51, y: 50 },
  { name: 'Yaoundé', country: 'Cameroun', x: 53, y: 52 },
  { name: "N'Djamena", country: 'Tchad', x: 56, y: 40 },
  { name: 'Bangui', country: 'RCA', x: 59, y: 49 },
  { name: 'Brazzaville', country: 'Congo', x: 55, y: 61 },
  { name: 'Malabo', country: 'Guinée Équat.', x: 48, y: 53 },
  // UEMOA (XOF)
  { name: 'Dakar', country: 'Sénégal', x: 18, y: 36 },
  { name: 'Abidjan', country: "Côte d'Ivoire", x: 27, y: 48 },
  { name: 'Ouagadougou', country: 'Burkina Faso', x: 31, y: 40 },
  { name: 'Bamako', country: 'Mali', x: 24, y: 35 },
  { name: 'Lomé', country: 'Togo', x: 35, y: 48 },
  { name: 'Cotonou', country: 'Bénin', x: 37, y: 48 },
  { name: 'Niamey', country: 'Niger', x: 37, y: 37 },
];

// Autres villes du réseau panafricain, hors zone CFA (paiement Mobile Money
// local non couvert aujourd'hui — développeurs disponibles quand même).
const OTHER_NODES = [
  { name: 'Lagos', country: 'Nigeria', x: 44, y: 46 },
  { name: 'Accra', country: 'Ghana', x: 33, y: 46 },
  { name: 'Casablanca', country: 'Maroc', x: 32, y: 18 },
  { name: 'Nairobi', country: 'Kenya', x: 73, y: 56 },
  { name: 'Harare', country: 'Zimbabwe', x: 68, y: 76 },
];

export const AfricaMap: React.FC<AfricaMapProps> = ({
  developers,
  onSelectDeveloper,
  selectedCountry
}) => {
  return (
    <div className="relative w-full aspect-[4/3] max-w-3xl mx-auto bg-[#0A0A0F] rounded-3xl p-4 sm:p-8 border border-[#0066FF]/30 overflow-hidden shadow-[inset_0_0_50px_rgba(13,27,42,0.8)]">

      {/* Background Cyber Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0066FF10_1px,transparent_1px),linear-gradient(to_bottom,#0066FF10_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>

      {/* Map Heading Badge */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#0D1B2A] border border-[#0066FF]/40 text-[11px] font-mono text-[#00FF88] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
        <span>GHULABE Pan-African Backbone</span>
      </div>

      {/* Legend zone CFA */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#FFD700]/40 text-[9px] font-mono text-[#FFD700] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>
        <span>Zone CFA — Mobile Money</span>
      </div>

      {/* Stylized SVG Africa Contour & Countries */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_20px_rgba(0,102,255,0.25)] select-none"
      >
        {/* Silhouette réaliste du continent africain — Corne de l'Afrique à l'est,
            golfe de Guinée en creux, pointe du Cap de Bonne-Espérance au sud */}
        <path
          d="M 33 6 L 47 5 L 60 8 L 70 14 L 79 22 L 87 33 L 92 41 L 91 46 L 85 44 L 81 48 L 79 55 L 76 63 L 72 71 L 66 80 L 58 89 L 51 96 L 46 91 L 44 82 L 42 72 L 45 62 L 48 56 L 43 51 L 37 53 L 30 50 L 22 45 L 14 38 L 9 30 L 7 22 L 13 16 L 21 11 L 27 8 Z"
          fill="#0D1B2A"
          stroke="#0066FF"
          strokeWidth="0.7"
          strokeOpacity="0.5"
          className="transition-all duration-300"
        />

        {/* Madagascar */}
        <ellipse cx="83" cy="68" rx="2.2" ry="6" fill="#0D1B2A" stroke="#0066FF" strokeWidth="0.5" strokeOpacity="0.4" transform="rotate(15 83 68)" />

        {/* Zone CEMAC (Afrique Centrale) — surlignage doré */}
        <path
          d="M 45 38 L 62 36 L 63 55 L 58 65 L 48 66 L 44 55 Z"
          fill="#FFD700"
          fillOpacity="0.08"
          stroke="#FFD700"
          strokeWidth="0.5"
          strokeOpacity="0.45"
          strokeDasharray="1.5,1"
        />

        {/* Zone UEMOA (Afrique de l'Ouest) — surlignage doré */}
        <path
          d="M 14 30 L 40 32 L 40 50 L 24 52 L 14 42 Z"
          fill="#FFD700"
          fillOpacity="0.08"
          stroke="#FFD700"
          strokeWidth="0.5"
          strokeOpacity="0.45"
          strokeDasharray="1.5,1"
        />

        {/* Liaisons réseau entre les nœuds zone CFA */}
        <g stroke="#FFD700" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.5">
          <line x1="18" y1="36" x2="24" y2="35" />
          <line x1="24" y1="35" x2="31" y2="40" />
          <line x1="31" y1="40" x2="37" y2="37" />
          <line x1="37" y1="37" x2="27" y2="48" />
          <line x1="27" y1="48" x2="35" y2="48" />
          <line x1="35" y1="48" x2="37" y2="48" />
          <line x1="51" y1="50" x2="53" y2="52" />
          <line x1="53" y1="52" x2="54" y2="58" />
          <line x1="54" y1="58" x2="55" y2="61" />
          <line x1="51" y1="50" x2="56" y2="40" />
          <line x1="51" y1="50" x2="59" y2="49" />
          <line x1="51" y1="50" x2="48" y2="53" />
        </g>

        {/* Liaisons réseau vers les autres nœuds panafricains */}
        <g stroke="#0066FF" strokeWidth="0.25" strokeDasharray="1,1.5" opacity="0.35">
          <line x1="44" y1="46" x2="33" y2="46" />
          <line x1="44" y1="46" x2="51" y2="50" />
          <line x1="32" y1="18" x2="24" y2="35" />
          <line x1="55" y1="61" x2="73" y2="56" />
          <line x1="73" y1="56" x2="68" y2="76" />
        </g>

        {/* Nœuds hors zone CFA — bleu, plus discrets */}
        {OTHER_NODES.map((node, idx) => {
          const matchingDevs = developers.filter(d => d.city.toLowerCase() === node.name.toLowerCase());
          const isSelected = selectedCountry === node.country;
          return (
            <g
              key={`other-${idx}`}
              className="cursor-pointer group"
              onClick={() => matchingDevs.length > 0 && onSelectDeveloper(matchingDevs[0])}
            >
              <circle cx={node.x} cy={node.y} r={isSelected ? '3.5' : '2.2'} fill="#0066FF" opacity="0.25" className="animate-ping" />
              <circle cx={node.x} cy={node.y} r={isSelected ? '1.7' : '1'} fill={isSelected ? '#00FF88' : '#0066FF'} className="transition-all duration-300 group-hover:fill-[#00FF88]" />
              <text x={node.x + 2} y={node.y + 1} fill="#9CA3AF" fontSize="2.6" fontFamily="Space Grotesk, sans-serif" fontWeight="600" className="select-none group-hover:fill-white transition-colors">
                {node.name}
              </text>
            </g>
          );
        })}

        {/* Nœuds zone CFA — dorés, mis en évidence, plus grands */}
        {CFA_ZONE_NODES.map((node, idx) => {
          const matchingDevs = developers.filter(d => d.city.toLowerCase() === node.name.toLowerCase());
          const isSelected = selectedCountry === node.country;
          return (
            <g
              key={`cfa-${idx}`}
              className="cursor-pointer group"
              onClick={() => matchingDevs.length > 0 && onSelectDeveloper(matchingDevs[0])}
            >
              <circle cx={node.x} cy={node.y} r={isSelected ? '4.5' : '3'} fill="#FFD700" opacity="0.3" className="animate-ping" />
              <circle cx={node.x} cy={node.y} r={isSelected ? '2.2' : '1.4'} fill={isSelected ? '#00FF88' : '#FFD700'} stroke="#0A0A0F" strokeWidth="0.3" className="transition-all duration-300 group-hover:fill-[#00FF88]" />
              <text x={node.x + 2.5} y={node.y + 1} fill="white" fontSize="3" fontFamily="Space Grotesk, sans-serif" fontWeight="700" className="drop-shadow-[0_1px_2px_rgba(0,0,0,1)] select-none group-hover:fill-[#00FF88] transition-colors">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 bg-[#0D1B2A]/90 px-3 py-1.5 rounded-xl border border-[#FFD700]/30 text-[9px] font-mono text-[#FFD700]">
        ● {CFA_ZONE_NODES.length} villes zone CFA (CEMAC + UEMOA)
      </div>
      <div className="absolute bottom-4 right-4 bg-[#0D1B2A]/90 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300">
        📍 {CFA_ZONE_NODES.length + OTHER_NODES.length} Nœuds Actifs • Latence &lt; 25ms
      </div>
    </div>
  );
};
