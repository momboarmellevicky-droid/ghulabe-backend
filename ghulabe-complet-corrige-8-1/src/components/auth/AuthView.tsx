import React, { useState } from 'react';
import { GhulabeBackend } from '../../services/apiClient';
import { Language } from '../../types';
import { Lock, Mail, User, Globe, ArrowRight, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react';

// Forme du user renvoyé par verify2FA (server/controllers/authController.ts) : volontairement
// plus restreinte que l'interface User complète (pas de name/country, non stockés dans le JWT).
export interface BackendAuthUser {
  id: string;
  email: string;
  role: 'user' | 'dev' | 'admin';
  plan: 'gratuit' | 'gardien' | 'pentest_premium';
  is2faVerified: boolean;
}

interface AuthViewProps {
  lang: Language;
  onLoginSuccess: (accessToken: string, user: BackendAuthUser) => void;
}

type Step = 'credentials' | 'otp';

export const AuthView: React.FC<AuthViewProps> = ({ lang, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Gabon');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [devNote, setDevNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (mode === 'register') {
        await GhulabeBackend.register(email, password, fullName || email.split('@')[0], country);
        setSuccessMsg(lang === 'fr'
          ? "✅ Compte créé. Authentification 2FA obligatoire : connectez-vous maintenant."
          : "✅ Account created. 2FA is mandatory: please sign in now."
        );
        setMode('login');
        setPassword('');
      } else {
        const { challengeId: newChallengeId, devNote: note } = await GhulabeBackend.loginStep1(email, password);
        setChallengeId(newChallengeId);
        setDevNote(note || '');
        setStep('otp');
        setSuccessMsg(lang === 'fr'
          ? "📧 Code de vérification envoyé par email. Saisissez-le ci-dessous."
          : "📧 Verification code sent by email. Enter it below."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'fr' ? "Erreur d'authentification." : "Authentication error."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const { accessToken, user } = await GhulabeBackend.verify2FA(challengeId, otp);
      setSuccessMsg(lang === 'fr' ? "✅ Connexion sécurisée active (24h)." : "✅ Secure session active (24h).");
      onLoginSuccess(accessToken, user);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'fr' ? "Code 2FA incorrect." : "Invalid 2FA code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 p-6 sm:p-8 glass-card rounded-3xl border border-[#0066FF]/40 shadow-[0_0_40px_rgba(0,102,255,0.2)]">
      <div className="text-center mb-6">
        <span className="px-3 py-1 rounded-full bg-[#0066FF]/20 text-[#0066FF] font-mono text-xs font-bold uppercase tracking-wider">
          🔒 Backend JWT (24h) • 2FA obligatoire • AES-256
        </span>
        <h2 className="text-2xl font-display font-extrabold text-white mt-2">
          {step === 'otp'
            ? (lang === 'fr' ? "Vérification 2FA" : "2FA Verification")
            : mode === 'login'
              ? (lang === 'fr' ? "Connexion GHULABE" : "GHULABE Login")
              : (lang === 'fr' ? "Créer un compte PME" : "Create SME Account")
          }
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {step === 'otp'
            ? (lang === 'fr' ? "Entrez le code à 6 chiffres reçu par email" : "Enter the 6-digit code sent by email")
            : mode === 'login'
              ? (lang === 'fr' ? "Connectez-vous avec email et mot de passe" : "Login with email and password")
              : (lang === 'fr' ? "Inscrivez-vous avec email et mot de passe" : "Register with email and password")
          }
        </p>
      </div>

      {step === 'credentials' && (
        <div className="flex bg-[#0D1B2A] p-1 rounded-xl border border-white/10 font-display font-bold text-xs mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); resetMessages(); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-[#0066FF] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {lang === 'fr' ? "Connexion" : "Login"}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); resetMessages(); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'register' ? 'bg-[#00FF88] text-[#0A0A0F] shadow font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            {lang === 'fr' ? "Inscription" : "Register"}
          </button>
        </div>
      )}

      {step === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-left text-xs sm:text-sm">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="font-mono text-gray-300 text-xs">
                  {lang === 'fr' ? "Nom ou Raison Sociale" : "Full Name / Company"} *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="ex: Mombo Armelle Vicky"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-gray-300 text-xs">
                  {lang === 'fr' ? "Pays" : "Country"} *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                  >
                    <option value="Gabon">Gabon</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Maroc">Maroc</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Email professionnel" : "Email address"} *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="direction@entreprise.ga"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Mot de passe" : "Password"} *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-[#FF2D2D] text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] hover:from-[#0052CC] hover:to-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>
              {loading
                ? (lang === 'fr' ? "Traitement..." : "Processing...")
                : (mode === 'login' ? (lang === 'fr' ? "Continuer (Étape 1/2)" : "Continue (Step 1/2)") : (lang === 'fr' ? "Créer le compte" : "Create account"))
              }
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 text-left text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Code de vérification (6 chiffres)" : "Verification code (6 digits)"} *
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FF88]" />
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#00FF88]/50 text-white font-mono text-sm tracking-[0.3em] text-center focus:border-[#00FF88] focus:outline-none"
                required
                autoFocus
              />
            </div>
            {devNote && (
              <p className="text-[10px] text-gray-500 font-mono mt-1">{devNote}</p>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-[#FF2D2D] text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] hover:from-[#0052CC] hover:to-[#00CC6A] text-[#0A0A0F] font-display font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,102,255,0.5)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>
              {loading
                ? (lang === 'fr' ? "Vérification..." : "Verifying...")
                : (lang === 'fr' ? "Valider (Étape 2/2)" : "Verify (Step 2/2)")
              }
            </span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); resetMessages(); setOtp(''); }}
            className="w-full text-center text-xs text-gray-500 hover:text-white underline font-mono cursor-pointer"
          >
            {lang === 'fr' ? "← Retour" : "← Back"}
          </button>
        </form>
      )}
    </div>
  );
};
