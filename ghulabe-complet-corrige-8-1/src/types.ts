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
  certified?: boolean;
  certified_at?: string;
  certification_score?: number;
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
  mission_id: string;
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
