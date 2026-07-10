import React from 'react';
import { Developer } from '../../types';

interface AfricaMapProps {
  developers: Developer[];
  onSelectDeveloper: (dev: Developer) => void;
  selectedCountry?: string;
}

export const AfricaMap: React.FC<AfricaMapProps> = ({
  developers,
  onSelectDeveloper,
  selectedCountry
}) => {
  // Cities specified in requirements
  const targetNodes = [
    { name: 'Libreville', country: 'Gabon', x: 52, y: 55, coords: [9.45, 0.39] },
    { name: 'Douala', country: 'Cameroun', x: 49, y: 49, coords: [9.70, 3.87] },
    { name: 'Dakar', country: 'Sénégal', x: 20, y: 38, coords: [-17.44, 14.69] },
    { name: 'Accra', country: 'Ghana', x: 38, y: 48, coords: [-0.19, 5.55] },
    { name: 'Lagos', country: 'Nigeria', x: 44, y: 46, coords: [3.39, 6.45] },
    { name: 'Casablanca', country: 'Maroc', x: 32, y: 18, coords: [-7.58, 33.57] },
    { name: 'Nairobi', country: 'Kenya', x: 73, y: 56, coords: [36.82, -1.29] },
    { name: 'Harare', country: 'Zimbabwe', x: 68, y: 76, coords: [31.05, -17.83] }
  ];

  return (
    <div className="relative w-full aspect-[4/3] max-w-3xl mx-auto bg-[#0A0A0F] rounded-3xl p-4 sm:p-8 border border-[#0066FF]/30 overflow-hidden shadow-[inset_0_0_50px_rgba(13,27,42,0.8)]">
      
      {/* Background Cyber Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0066FF10_1px,transparent_1px),linear-gradient(to_bottom,#0066FF10_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>
      
      {/* Map Heading Badge */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#0D1B2A] border border-[#0066FF]/40 text-[11px] font-mono text-[#00FF88] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping"></span>
        <span>GHULABE Pan-African Backbone</span>
      </div>

      {/* Stylized SVG Africa Contour & Countries */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_20px_rgba(0,102,255,0.25)] select-none"
      >
        {/* Silhouette of Africa continent polygon */}
        <path
          d="M 28 15 L 42 12 L 55 16 L 68 28 L 88 45 L 75 58 L 65 85 L 55 92 L 42 80 L 38 65 L 45 55 L 48 50 L 38 48 L 18 38 L 18 30 L 28 15 Z"
          fill="#0D1B2A"
          stroke="#0066FF"
          strokeWidth="0.8"
          strokeOpacity="0.5"
          className="transition-all duration-300 hover:fill-[#122438]"
        />

        {/* Sub-region stylized border polygons */}
        <path d="M 28 15 L 55 16 L 44 46 L 18 38 Z" fill="none" stroke="#0066FF" strokeWidth="0.4" strokeOpacity="0.3" />
        <path d="M 55 16 L 88 45 L 73 56 L 44 46 Z" fill="none" stroke="#0066FF" strokeWidth="0.4" strokeOpacity="0.3" />
        <path d="M 44 46 L 73 56 L 65 85 L 38 65 Z" fill="none" stroke="#0066FF" strokeWidth="0.4" strokeOpacity="0.3" />

        {/* Network Connection Lines between Nodes */}
        <g stroke="#0066FF" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.6">
          <line x1="32" y1="18" x2="20" y2="38" />
          <line x1="20" y1="38" x2="38" y2="48" />
          <line x1="38" y1="48" x2="44" y2="46" />
          <line x1="44" y1="46" x2="49" y2="49" />
          <line x1="49" y1="49" x2="52" y2="55" />
          <line x1="52" y1="55" x2="73" y2="56" />
          <line x1="73" y1="56" x2="68" y2="76" />
        </g>

        {/* Glowing Pulsing Blue Nodes & Labels */}
        {targetNodes.map((node, idx) => {
          const matchingDevs = developers.filter(d => d.city.toLowerCase() === node.name.toLowerCase());
          const isSelected = selectedCountry === node.country;

          return (
            <g 
              key={idx} 
              className="cursor-pointer group"
              onClick={() => {
                if (matchingDevs.length > 0) {
                  onSelectDeveloper(matchingDevs[0]);
                }
              }}
            >
              {/* Outer Pulsing Halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? "4.5" : "3"}
                fill="#0066FF"
                opacity="0.3"
                className="animate-ping"
              />

              {/* Inner Glowing Point */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? "2" : "1.2"}
                fill={isSelected ? "#00FF88" : "#0066FF"}
                className="transition-all duration-300 group-hover:fill-[#00FF88] group-hover:r-2"
              />

              {/* City Label (font 10px equivalent scaling in viewBox) */}
              <text
                x={node.x + 2.5}
                y={node.y + 1}
                fill="white"
                fontSize="3.2"
                fontFamily="Space Grotesk, sans-serif"
                fontWeight="700"
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,1)] select-none group-hover:fill-[#00FF88] transition-colors"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 right-4 bg-[#0D1B2A]/90 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300">
        📍 {targetNodes.length} Nœuds Actifs • Latence &lt; 25ms
      </div>
    </div>
  );
};
