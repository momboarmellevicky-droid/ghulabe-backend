import React, { useState, useEffect } from 'react';
import { Language, TabType, User, Domain } from './types';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { BottomNav } from './components/common/BottomNav';
import { SecurityHeadersBanner } from './components/common/SecurityHeadersBanner';
import { HomeView } from './components/home/HomeView';
import { ScanView } from './components/scan/ScanView';
import { DashboardView } from './components/dash/DashboardView';
import { DevsPortalView } from './components/devs/DevsPortalView';
import { MeView } from './components/me/MeView';
import { LegalModal } from './components/legal/LegalModal';
import { AuthView, BackendAuthUser } from './components/auth/AuthView';
import { GhulabeBackend } from './services/apiClient';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  // Token JWT backend (signAccessToken/verifyAccessToken, 24h) — distinct de toute session
  // Supabase Auth. C'est ce token, et lui seul, que requireAuth() accepte côté serveur.
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try { return localStorage.getItem('ghulabe_access_token'); } catch { return null; }
  });

  // Active user mock state (Mombo Armelle Vicky / SME Client)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-pme-master',
    email: 'direction@africacyber-pme.ga',
    name: 'Mombo Armelle Vicky',
    country: 'Gabon',
    role: 'admin',
    plan: 'gardien',
    created_at: '2026-01-01T00:00:00.000Z',
    is2FAEnabled: true
  });

  // Monitored domains state
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: 'dom-1',
      user_id: 'usr-pme-master',
      url: 'ebanking-pme-africa.sn',
      last_scan: 'Il y a 2 heures',
      score: 3.2,
      status: 'critical'
    },
    {
      id: 'dom-2',
      user_id: 'usr-pme-master',
      url: 'store-dakar-express.com',
      last_scan: 'Hier à 14:20',
      score: 8.5,
      status: 'safe'
    },
    {
      id: 'dom-3',
      user_id: 'usr-pme-master',
      url: 'assurances-libreville.ga',
      last_scan: '12 Janvier 2026',
      score: 6.4,
      status: 'warning'
    }
  ]);

  // Scanner direct launch state
  const [scanTargetUrl, setScanTargetUrl] = useState('');
  const [isScanAutoStarted, setIsScanAutoStarted] = useState(false);
  const [devPortalMode, setDevPortalMode] = useState<'find' | 'become'>('find');
  const [legalPage, setLegalPage] = useState<'mentions' | 'privacy' | 'cgu' | 'disclaimer' | 'cookies' | null>(null);

  // Set document title dynamically
  useEffect(() => {
    document.title = lang === 'fr'
      ? "GHULABE — 1ère plateforme de cybersécurité bilingue pour PME africaines"
      : "GHULABE — 1st bilingual cybersecurity platform for African SMEs";
  }, [lang]);

  // Réhydrate la session au chargement à partir du JWT backend stocké en local (s'il existe et
  // n'est pas expiré). On décode uniquement le payload (pas de vérification de signature côté
  // client — inutile ici : chaque appel API réel est de toute façon revérifié par requireAuth()
  // côté serveur). Un token invalide/expiré est simplement effacé, sans bloquer l'app.
  useEffect(() => {
    if (!accessToken) return;
    try {
      const payloadB64 = accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expiré');
      }
      setSessionUser({
        id: payload.id,
        email: payload.email,
        name: payload.email?.split('@')[0] || 'Utilisateur GHULABE',
        country: 'Gabon',
        role: payload.role,
        plan: payload.plan,
        created_at: '2026-01-01T00:00:00.000Z',
        is2FAEnabled: true,
      });
    } catch (err) {
      console.warn('[GHULABE Session] Token local invalide/expiré, session effacée.', err);
      try { localStorage.removeItem('ghulabe_access_token'); } catch {}
      setAccessToken(null);
      setSessionUser(null);
    }
  }, [accessToken]);

  // Appelée par AuthView après validation 2FA réussie : reçoit le vrai JWT backend + le user
  // (forme réduite BackendAuthUser) et construit un objet User complet pour le reste de l'app.
  const handleLoginSuccess = (token: string, user: BackendAuthUser) => {
    try { localStorage.setItem('ghulabe_access_token', token); } catch {}
    setAccessToken(token);
    setSessionUser({
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0] || '
