import React, { useState, useEffect } from 'react';
import { Language, User, Domain, Alert, TabType } from '../../types';
import { getT } from '../../data/i18n';
import { MOCK_ALERTS } from '../../data/mockData';
import { GhulabeBackend } from '../../services/apiClient';
import { 
  Globe, Bell, ArrowUpRight, Plus, 
  CheckCircle2, AlertTriangle, AlertOctagon, Smartphone, Mail, Zap
} from 'lucide-react';
              Pour 5 000 FCFA/mois, GHULABE vérifie votre site toutes les heures, vous alerte par SMS et stocke vos historiques d'audit bilingues.
            </p>
            <button
              onClick={() => onSelectPlan('gardien')}
              className="w-full py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase transition-all cursor-pointer"
            >
              Activer le Gardien maintenant
            </button>
          </div>
        </div>

      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card p-8 rounded-3xl max-w-md w-full border border-[#0066FF] shadow-[0_0_40px_rgba(0,102,255,0.3)] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-white">Ajouter un Domaine</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 font-sans">
              Entrez l'URL du domaine à auditer en continu. Vous devez disposer des droits d'administrateur.
            </p>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input
                type="text"
                value={newDomainUrl}
                onChange={(e) => setNewDomainUrl(e.target.value)}
                placeholder="ex: masociete-douala.cm"
                className="w-full p-3.5 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-sm focus:border-[#00FF88] focus:outline-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(0,102,255,0.5)]"
                >
                  Ajouter au scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
