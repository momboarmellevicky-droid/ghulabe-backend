import React, { useState } from 'react';
import { GhulabeBackend } from '../../services/apiClient';
import { Language } from '../../types';
import { Lock, Mail, User, Globe, ArrowRight, CheckCircle2, AlertOctagon, ShieldCheck, Eye, EyeOff, Smartphone } from 'lucide-react';

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

type Step = 'credentials' | 'otp' | 'forgot' | 'forgot-reset';

export const AuthView: React.FC<AuthViewProps> = ({ lang, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Gabon');
  const [otp, setOtp] = useState('');
  const [challengeId] = useState('');
  const [devNote, setDevNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetId, setResetId] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
        await GhulabeBackend.register(email, password, fullName || email.split('@')[0], country, phone);
        setSuccessMsg(lang === 'fr'
          ? "✅ Compte créé. Authentification 2FA obligatoire : connectez-vous maintenant."
          : "✅ Account created. 2FA is mandatory: please sign in now."
        );
        setMode('login');
        setPassword('');
      } else {
        const { accessToken, user } = await GhulabeBackend.login(email, password);
        setSuccessMsg(lang === 'fr'
          ? "✅ Connexion réussie."
          : "✅ Login successful."
        );
        onLoginSuccess(accessToken, user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'fr' ? "Erreur d'authentification." : "Authentication error."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const { resetId: newResetId, devNote: note } = await GhulabeBackend.forgotPassword(email, lang);
      setResetId(newResetId || '');
      setDevNote(note || '');
      setStep('forgot-reset');
      setSuccessMsg(lang === 'fr'
        ? "📧 Si un compte existe, un code a été envoyé par email."
        : "📧 If an account exists, a code has been sent by email."
      );
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'fr' ? "Erreur." : "Error."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await GhulabeBackend.resetPassword(resetId, otp, newPassword);
      setSuccessMsg(lang === 'fr' ? "✅ Mot de passe réinitialisé. Connectez-vous." : "✅ Password reset. Please log in.");
      setStep('credentials');
      setMode('login');
      setOtp('');
      setNewPassword('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'fr' ? "Code incorrect." : "Invalid code."));
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
            : step === 'forgot'
              ? (lang === 'fr' ? "Mot de passe oublié" : "Forgot password")
              : step === 'forgot-reset'
                ? (lang === 'fr' ? "Réinitialiser le mot de passe" : "Reset password")
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
                  {lang === 'fr' ? "Numéro WhatsApp" : "WhatsApp number"} *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="ex: +24177123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  {lang === 'fr' ? "Format international avec indicatif pays" : "International format with country code"}
                </p>
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono border focus:outline-none focus:border-[#0066FF] appearance-none"
                    required
                  >
                    <option value="Gabon">Gabon</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Congo">Congo</option>
                    <option value="Togo">Togo</option>
                    <option value="Bénin">Bénin</option>
                    <option value="Autre">{lang === 'fr' ? "Autre" : "Other"}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex: contact@entreprise.ga"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono placeholder:text-gray-500 border focus:outline-none focus:border-[#0066FF]"
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono placeholder:text-gray-500 border focus:outline-none focus:border-[#0066FF]"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => { setStep('forgot'); resetMessages(); }}
                className="text-xs font-mono text-[#0066FF] hover:underline cursor-pointer"
              >
                {lang === 'fr' ? "Mot de passe oublié ?" : "Forgot password?"}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 text-[#00FF88] text-xs font-mono bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0066FF] text-white font-display font-extrabold text-sm shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? (lang === 'fr' ? "Chargement..." : "Loading...")
              : mode === 'login'
                ? (lang === 'fr' ? "Se connecter" : "Sign in")
                : (lang === 'fr' ? "Créer le compte" : "Create account")
            }
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      ) : step === 'otp' ? (
        <form onSubmit={handleOtpSubmit} className="space-y-4 text-left text-xs sm:text-sm">
          {devNote && (
            <div className="text-[10px] font-mono text-gray-500 bg-white/5 rounded-lg p-2 break-all">{devNote}</div>
          )}
          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Code de vérification" : "Verification code"} *
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono tracking-[0.3em] placeholder:text-gray-500 placeholder:tracking-normal border focus:outline-none focus:border-[#0066FF]"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 text-[#00FF88] text-xs font-mono bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0066FF] text-white font-display font-extrabold text-sm shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (lang === 'fr' ? "Vérification..." : "Verifying...") : (lang === 'fr' ? "Valider le code" : "Verify code")}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); resetMessages(); setOtp(''); }}
            className="w-full text-center text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
          >
            {lang === 'fr' ? "← Retour" : "← Back"}
          </button>
        </form>
      ) : step === 'forgot' ? (
        <form onSubmit={handleForgotSubmit} className="space-y-4 text-left text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex: contact@entreprise.ga"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono placeholder:text-gray-500 border focus:outline-none focus:border-[#0066FF]"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 text-[#00FF88] text-xs font-mono bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0066FF] text-white font-display font-extrabold text-sm shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (lang === 'fr' ? "Envoi..." : "Sending...") : (lang === 'fr' ? "Envoyer le code" : "Send code")}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setMode('login'); resetMessages(); }}
            className="w-full text-center text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
          >
            {lang === 'fr' ? "← Retour à la connexion" : "← Back to login"}
          </button>
        </form>
      ) : (
      <form onSubmit={handleResetSubmit} className="space-y-4 text-left text-xs sm:text-sm">
          {devNote && (
            <div className="text-[10px] font-mono text-gray-500 bg-white/5 rounded-lg p-2 break-all">{devNote}</div>
          )}
          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Code reçu par email" : "Code received by email"} *
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono tracking-[0.3em] placeholder:text-gray-500 placeholder:tracking-normal border focus:outline-none focus:border-[#0066FF]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-gray-300 text-xs">
              {lang === 'fr' ? "Nouveau mot de passe" : "New password"} *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0A0A0F] border-[#0066FF]/50 text-white font-mono placeholder:text-gray-500 border focus:outline-none focus:border-[#0066FF]"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 text-[#00FF88] text-xs font-mono bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0066FF] text-white font-display font-extrabold text-sm shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (lang === 'fr' ? "Réinitialisation..." : "Resetting...") : (lang === 'fr' ? "Réinitialiser" : "Reset password")}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setMode('login'); resetMessages(); }}
            className="w-full text-center text-xs font-mono text-gray-400 hover:text-white cursor-pointer"
          >
            {lang === 'fr' ? "← Retour à la connexion" : "← Back to login"}
          </button>
        </form>
      )}
    </div>
  );
};
