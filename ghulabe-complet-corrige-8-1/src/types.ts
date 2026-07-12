export type Language = 'fr' | 'en';

export type Severity = 'critique' | 'eleve' | 'moyen' | 'faible';

export interface User {
  id: string;
  email: string;
  name: string;
  country: string;
  role: 'user' | 'dev' | 'admin';
  plan: 'gratuit' | 'gardien' | 'pentest_premium';
  created_at: string;
  is2FAEnabled?: boolean;
}

export interface VulnerabilityFinding {
  id: string;
  title_fr: string;
  title_en: string;
  severity: Severity;
  category: string;
  cve_id?: string;
  // For CEO
  ceo_impact_fr: string;
  ceo_impact_en: string;
  financial_risk_fr: string;
  financial_risk_en: string;
  urgency_fr: string;
  urgency_en: string;
  // For Developer
  tech_details_fr: string;
  tech_details_en: string;
  remediation_code: string;
  remediation_lang: string;
}

export interface ScanResult {
  id: string;
  domain_id: string;
  url: string;
  score: number; // out of 10
  scan_duration_seconds: number;
  created_at: string;
  findings: VulnerabilityFinding[];
  status: 'scanning' | 'completed' | 'failed';
  report_pdf_url?: string;
  headers_checked: {
    hsts: boolean;
    csp: boolean;
    x_frame_options: boolean;
    x_content_type_options: boolean;
  };
  ssl_status: {
    valid: boolean;
    expires_in_days: number;
    issuer: string;
  };
  exposed_files: string[];
}

export interface Domain {
  id: string;
  user_id: string;
  url: string;
  last_scan?: string;
  score?: number;
  status: 'safe' | 'warning' | 'critical' | 'unscanned';
}

export type BadgeLevel = 'GHULABE RECRUIT' | 'GHULABE CERTIFIED' | 'GHULABE EXPERT';

export interface Developer {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  speciality: 'AppSec' | 'DevSecOps' | 'Pentest' | 'Network Security';
  languages: string[];
  rate_fcfa: number;
  experience_years: number;
  portfolio_url: string;
  bio: string;
  badge_level: BadgeLevel;
  rating: number;
  missions_completed: number;
  status: 'active' | 'suspended' | 'pending';
  avatar?: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface QCMQuestion {
  id: number;
  block: 'A' | 'B' | 'C' | 'D';
  blockTitleFr: string;
  blockTitleEn: string;
  questionFr: string;
  questionEn: string;
  optionsFr: string[];
  optionsEn: string[];
  correctOptionIndex: number;
}

export interface DevApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  city: string;
  speciality: 'AppSec' | 'DevSecOps' | 'Pentest' | 'Network Security';
  languages: string[];
  rate_fcfa: number;
  experience: number;
  portfolio: string;
  bio: string;
  step: 1 | 2 | 3 | 4 | 'completed' | 'rejected';
  fee_paid: boolean;
  smile_identity_status: 'pending' | 'verified' | 'rejected';
  test_score?: number; // percentage
  webcam_photos: string[];
  status: 'pending' | 'approved' | 'rejected' | 'test_failed';
  created_at: string;
  next_attempt_allowed_at?: string;
}

export interface Mission {
  id: string;
  client_id: string;
  client_name: string;
  developer_id: string;
  developer_name: string;
  description: string;
  url: string;
  urgency: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  budget_fcfa: number;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  legal_checkbox_accepted: boolean;
  created_at: string;
  rating?: {
    stars: number;
    review: string;
  };
}

export interface Message {
  id: string;
  {realDomains.map((dom) => (
                <div key={dom.id} className="glass-card p-4 rounded-2xl border border-[#0066FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {dom.status === 'safe' && <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />}
                    {dom.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                    {dom.status === 'critical' && <AlertOctagon className="w-5 h-5 text-red-500" />}
                    {dom.status === 'unscanned' && <Smartphone className="w-5 h-5 text-gray-400" />}
                    <div>
                      <p className="text-white font-mono text-sm">{dom.url}</p>
                      <p className="text-xs text-gray-400">
                        {dom.last_scan
                          ? (lang === 'fr' ? `Dernier scan : ${new Date(dom.last_scan).toLocaleDateString('fr-FR')}` : `Last scan: ${new Date(dom.last_scan).toLocaleDateString('en-US')}`)
                          : (lang === 'fr' ? 'Jamais scanné' : 'Never scanned')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof dom.score === 'number' && (
                      <span className={`text-sm font-bold ${dom.score >= 8 ? 'text-[#00FF88]' : dom.score >= 5 ? 'text-yellow-400' : 'text-red-500'}`}>
                        {dom.score}/10
                      </span>
                    )}
                    <button
                      onClick={() => setActiveTab('scan')}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF] text-xs font-semibold transition"
                    >
                      <span>{lang === 'fr' ? 'Voir le rapport' : 'View report'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {realDomains.length === 0 && (
                <div className="glass-card p-8 rounded-2xl text-center text-gray-400 text-sm">
                  {lang === 'fr' ? 'Aucun domaine ajouté pour le moment.' : 'No domain added yet.'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-4 rounded-2xl">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-[#0066FF]" />
                <span>{lang === 'fr' ? 'Alertes' : 'Alerts'}</span>
              </h2>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => markAlertAsRead(alert.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      alert.is_read ? 'border-gray-700 opacity-50' : 'border-[#0066FF]/40 bg-[#0066FF]/5'
                    }`}
                  >
                    <p className="text-xs text-white">
                      {lang === 'fr' ? alert.message_fr : alert.message_en}
                    </p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Aucune alerte.' : 'No alerts.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 rounded-2xl max-w-md w-full">
              <h2 className="text-xl font-display font-bold text-white mb-4">{t.addDomain}</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <input
                  type="text"
                  value={newDomainUrl}
                  onChange={(e) => setNewDomainUrl(e.target.value)}
                  placeholder="exemple.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-[#0066FF]/30 text-white text-sm"
                />
                <label className="flex items-start gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(e) => setLegalAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    {lang === 'fr'
                      ? "Je confirme disposer des droits d'administrateur sur ce domaine."
                      : "I confirm I have admin rights on this domain."}
                  </span>
                </label>
                {addError && <p className="text-xs text-red-500">{addError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 text-sm"
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingDomain}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {isAddingDomain ? '...' : (lang === 'fr' ? 'Ajouter' : 'Add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
};
  sender_id: string;
  sender_name: string;
  sender_role: 'client' | 'developer' | 'admin';
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

export type TabType = 'home' | 'scan' | 'dash' | 'devs' | 'me';

export interface Alert {
  id: string;
  domain_id: string;
  domain_url: string;
  severity: Severity;
  message_fr: string;
  message_en: string;
  is_read: boolean;
  created_at: string;
}
