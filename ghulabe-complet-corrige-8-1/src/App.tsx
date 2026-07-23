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
import { PaymentModal } from './components/common/PaymentModal';

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
  const [pendingPlan, setPendingPlan] = useState<'gardien' | 'pentest_premium' | null>(null);

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
      name: user.email.split('@')[0] || 'Utilisateur GHULABE',
      country: 'Gabon',
      role: user.role,
      plan: user.plan,
      created_at: '2026-01-01T00:00:00.000Z',
      is2FAEnabled: user.is2faVerified,
    });
    // Redirection automatique vers le Scanner après connexion réussie :
    // l'utilisateur ne doit jamais avoir à chercher un onglet après s'être identifié.
    setActiveTab('scan');
  };

  const handleLogout = async () => {
    if (accessToken) await GhulabeBackend.logout(accessToken);
    try { localStorage.removeItem('ghulabe_access_token'); } catch {}
    setAccessToken(null);
    setSessionUser(null);
    alert(lang === 'fr' ? "Déconnexion réussie." : "Successfully logged out.");
  };

  const handleStartQuickScan = (url: string, _consentAccepted: boolean) => {
    setScanTargetUrl(url);
    setIsScanAutoStarted(true);
    setActiveTab('scan');
  };

  const handleAddMonitoredDomain = (url: string) => {
    const newDom: Domain = {
      id: `dom-${Date.now()}`,
      user_id: currentUser.id,
      url,
      last_scan: 'En attente scan externe',
      score: 7.0,
      status: 'warning'
    };
    setDomains([newDom, ...domains]);
    alert(lang === 'fr' ? `Domaine "${url}" ajouté à la surveillance Gardien 24/7 !` : `Domain "${url}" added to 24/7 Gardien monitoring!`);
  };

  const handleUpgradePlan = (newPlan: 'gratuit' | 'gardien' | 'pentest_premium') => {
    if (newPlan === 'gratuit') {
      setCurrentUser({ ...currentUser, plan: newPlan });
      return;
    }
    if (!accessToken) {
      alert(lang === 'fr'
        ? "Connectez-vous d'abord pour souscrire à une offre payante."
        : "Please log in first to subscribe to a paid plan.");
      return;
    }
    setPendingPlan(newPlan);
  };

  const handlePaymentSuccess = (confirmedPlan: 'gardien' | 'pentest_premium') => {
    setCurrentUser({ ...currentUser, plan: confirmedPlan });
    if (sessionUser) setSessionUser({ ...sessionUser, plan: confirmedPlan });
    setPendingPlan(null);
  };
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0F] text-gray-100 selection:bg-[#0066ff]">

      {/* Security Headers Production Telemetry Banner */}
      <SecurityHeadersBanner />

      {/* Main Header (Bilingual toggle, Navigation, CTA) */}
      <Header
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsScanAutoStarted(false);
          setActiveTab(tab);
        }}
        currentUser={sessionUser || currentUser}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full transition-all duration-300">
        {activeTab === 'home' && (
          <HomeView
            lang={lang}
            onStartScan={handleStartQuickScan}
            setActiveTab={(tab) => {
              if (tab === 'devs') setDevPortalMode('become');
              setActiveTab(tab);
            }}
            onSelectPlan={handleUpgradePlan}
          />
        )}

        {activeTab === 'scan' && (
          sessionUser ? (
            <ScanView
              lang={lang}
              accessToken={accessToken || undefined}
              initialUrl={scanTargetUrl}
              initialScanActive={isScanAutoStarted}
              setActiveTab={setActiveTab}
              onScanComplete={() => {
                setIsScanAutoStarted(false);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto py-12 px-4 space-y-6">
              <p className="text-center text-gray-300 text-sm">
                {lang === 'fr'
                  ? "Connectez-vous pour lancer un scan de sécurité."
                  : "Log in to run a security scan."}
              </p>
              <AuthView
                lang={lang}
                onLoginSuccess={handleLoginSuccess}
              />
            </div>
          )
        )}

        {activeTab === 'dash' && (
          <DashboardView
            lang={lang}
            currentUser={sessionUser || currentUser}
            accessToken={accessToken || undefined}
            domains={domains}
            onAddDomain={handleAddMonitoredDomain}
            setActiveTab={setActiveTab}
            onSelectPlan={handleUpgradePlan}
          />
        )}

        {activeTab === 'devs' && (
          <DevsPortalView
            lang={lang}
            initialMode={devPortalMode}
            accessToken={accessToken || undefined}
          />
        )}

        {activeTab === 'me' && (
          sessionUser ? (
            <MeView
              lang={lang}
              currentUser={sessionUser}
              accessToken={accessToken || undefined}
              onLogout={handleLogout}
              onOpenLegal={(page) => setLegalPage(page)}
            />
          ) : (
            <div className="space-y-6">
  <AuthView
    lang={lang}
    onLoginSuccess={handleLoginSuccess}
  />
  <div className="text-center">
    <button
      type="button"
      onClick={() => setSessionUser(currentUser)}
      className="w-full mt-3 py-3 rounded-xl bg-[#00FF88]/15 border-2 border-[#00FF88] text-[#00FF88] font-display font-bold text-sm"
    >
      {lang === 'fr' ? '⚡ Mode démo : Se connecter en tant qu\'admin Mombo Armelle Vicky' : '⚡ Demo mode: Log in as admin Mombo Armelle Vicky'}
    </button>
  </div>
</div>
      {/* Legal Modal Component */}
      <LegalModal
        lang={lang}
        page={legalPage}
        onClose={() => setLegalPage(null)}
      />

      {pendingPlan && accessToken && (
        <PaymentModal
          lang={lang}
          targetPlan={pendingPlan}
          accessToken={accessToken}
          onClose={() => setPendingPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Footer on all pages (Exclusif) */}
      <Footer
        lang={lang}
        onOpenLegal={(page) => setLegalPage(page)}
      />

      {/* Bottom Navigation on mobile devices */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsScanAutoStarted(false);
          setActiveTab(tab);
        }}
        lang={lang}
      />

    </div>
  );
};

export default App;
