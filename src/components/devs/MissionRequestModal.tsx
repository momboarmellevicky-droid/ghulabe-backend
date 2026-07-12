import React, { useState } from 'react';
import { Developer, Language, Mission } from '../../types';
import { getT } from '../../data/i18n';
import { 
  CheckSquare, Square, AlertOctagon, Globe, 
  Send, UserCheck
} from 'lucide-react';

interface MissionRequestModalProps {
  lang: Language;
  developer: Developer;
  onClose: () => void;
  onSubmitMission: (missionData: Partial<Mission>) => void;
}

export const MissionRequestModal: React.FC<MissionRequestModalProps> = ({
  lang,
  developer,
  onClose,
  onSubmitMission
}) => {
  const t = getT(lang);

  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('ebanking-pme-africa.sn');
  const [urgency, setUrgency] = useState<'Faible' | 'Moyen' | 'Élevé' | 'Critique'>('Critique');
  const [budgetFcfa, setBudgetFcfa] = useState(60000);
  const [checkboxAccepted, setCheckboxAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkboxAccepted) {
      setErrorMsg(lang === 'fr' 
        ? "Vous devez cocher la clause légale obligatoire de mise en relation."
        : "You must check the mandatory matchmaking legal clause."
      );
      return;
    }
    if (!description || !url) {
      setErrorMsg(lang === 'fr' ? "Veuillez remplir tous les champs requis." : "Please fill in all required fields.");
      return;
    }

    onSubmitMission({
      developer_id: developer.id,
      developer_name: developer.name,
      description,
      url,
      urgency,
      budget_fcfa: Number(budgetFcfa),
      legal_checkbox_accepted: true,
      status: 'accepted'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto py-10">
      <div className="glass-card max-w-xl w-full p-6 sm:p-10 rounded-3xl border border-[#0066FF] shadow-[0_0_50px_rgba(0,102,255,0.35)] space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/20 flex items-center justify-center text-[#0066FF] border border-[#0066FF]/40">
              <UserCheck className="w-6 h-6 text-[#00FF88]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00FF88] uppercase tracking-wider block">
                Mise en relation directe certifiée
              </span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                Missionner : {developer.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-mono text-sm p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-5 text-left text-xs sm:text-sm">
          
          {/* URL concernée */}
          <div className="space-y-1.5">
            <label className="font-mono text-gray-300 text-xs block">
              1. {lang === 'fr' ? "URL du domaine concerné" : "Concerned Domain URL"} *
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="ex: mondomaine-dakar.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Urgence & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-gray-300 text-xs block">
                2. {t.urgencySelect} *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full p-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
              >
                <option value="Critique">🔴 Critique (sous 24h)</option>
                <option value="Élevé">🟠 Élevé (sous 7 jours)</option>
                <option value="Moyen">🟡 Moyen (planifié)</option>
                <option value="Faible">🔵 Faible (recommandé)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-gray-300 text-xs block">
                3. {t.budgetInput} *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#00FF88] text-xs">FCFA</span>
                <input
                  type="number"
                  value={budgetFcfa}
                  onChange={(e) => setBudgetFcfa(Number(e.target.value))}
                  step="5000"
                  min="5000"
                  className="w-full pl-14 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-mono text-gray-300 text-xs block">
              4. {lang === 'fr' ? "Description détaillée de la faille à corriger" : "Detailed vulnerability description"} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={lang === 'fr' ? "Ex: Fichier .env exposé sur serveur Nginx, nous avons besoin de bloquer l'accès public..." : "e.g., Exposed .env on Nginx server..."}
              className="w-full p-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-sans text-xs focus:border-[#00FF88] focus:outline-none resize-none"
              required
            ></textarea>
          </div>

          {/* Clause obligatoire légale avant toute demande (REQUIRED CLAUSE) */}
          <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#FFB800]/40 text-left select-none">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div onClick={() => setCheckboxAccepted(!checkboxAccepted)} className="mt-0.5 shrink-0">
                {checkboxAccepted ? (
                  <CheckSquare className="w-5 h-5 text-[#00FF88]" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 group-hover:text-[#00FF88]" />
                )}
              </div>
              <span className="text-[11px] text-gray-300 font-sans leading-relaxed">
                <strong className="text-[#FFB800] uppercase block mb-1 font-mono text-[10px]">
                  Clause Légale Obligatoire
                </strong>
                {t.missionLegalCheckbox}
              </span>
            </label>
            {errorMsg && (
              <p className="mt-2 text-xs font-bold text-[#FF2D2D] flex items-center gap-1.5 animate-pulse">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Footer CTA */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] hover:from-[#0052CC] hover:to-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{t.sendMissionBtn}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
      
