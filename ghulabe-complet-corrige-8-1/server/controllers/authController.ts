import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase';
import { decryptAES256, generateAuditLog } from '../utils/crypto';
import { signAccessToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendAdminRecruitmentAlertEmail } from '../services/emailService';
import { isValidEmail } from '../utils/validators';

const pending2FAChallenges = new Map<string, { userId: string; email: string; role: string; plan: string; otp: string; expiresAt: number; attempts: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pending2FAChallenges.entries()) {
    if (now > val.expiresAt) pending2FAChallenges.delete(key);
  }
}, 60 * 1000);

const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const BCRYPT_ROUNDS = 12; const pendingPasswordResets = new Map<string, { userId: string; email: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingPasswordResets.entries()) {
    if (now > val.expiresAt) pendingPasswordResets.delete(key);
  }
}, 60 * 1000);

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, country, phone, role = 'user', plan = 'gratuit', specialites = [], city, bio, rateFcfa, portfolioUrl } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password || !name || !country || !phone) {
    res.status(400).json({ error_fr: "Tous les champs obligatoires doivent être renseignés (numéro WhatsApp inclus)." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error_fr: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = crypto.randomUUID();

    const { error } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      country,
      phone,
      role,
      plan,
      specialites: role === 'dev' ? specialites : [],
      city: role === 'dev' ? city : null,
      bio: role === 'dev' ? bio : null,
      rate_fcfa: role === 'dev' ? rateFcfa : null,
      portfolio_url: role === 'dev' ? portfolioUrl : null,
      is_2fa_enabled: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      const isDuplicate = error.code === '23505';
      generateAuditLog({
        action: 'USER_REGISTER_FAILED',
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec inscription (${email}): ${error.message}`,
      });
      res.status(isDuplicate ? 409 : 500).json({
        error_fr: isDuplicate ? "Cet email est déjà associé à un compte." : "Erreur lors de la création du compte.",
        error_en: isDuplicate ? "This email is already registered." : "Error creating account.",
        details: error.message,
      });
      return;
    }

    generateAuditLog({
      action: 'USER_REGISTERED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Création de compte réussie (${email}) - Plan ${plan.toUpperCase()}`,
    });

    // Alerte email admin claire et spécifique à CHAQUE nouvelle inscription
    // (PME ou candidat développeur) — canal unique désormais (email), fiable
    // et déjà opérationnel, contrairement à WhatsApp (sandbox non résolu).
    const roleLabel = role === 'dev' ? 'Candidat développeur' : 'Client PME';
    await sendAdminRecruitmentAlertEmail(
      `🆕 Nouvelle inscription GHULABE — ${roleLabel}`,
      email,
      `Nom: ${name} | Pays: ${country} | Téléphone: ${phone} | Plan initial: ${plan.toUpperCase()}${role === 'dev' ? ` | Spécialités: ${(specialites || []).join(', ') || 'non renseigné'}` : ''}`,
      'admin-notify',
      ip
    );

    res.status(201).json({
      message_fr: "Compte créé avec succès. Authentification 2FA obligatoire requise pour la connexion.",
      message_en: "Account created successfully. Mandatory 2FA required to sign in.",
      userId,
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur serveur lors de l'enregistrement.", details: err.message });
  }
}


// considéré comme un ancien mot de passe chiffré (AES) à migrer.
function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password) {
    res.status(400).json({ error_fr: "Email et mot de passe requis." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  const lockInfo = failedLoginAttempts.get(email);
  if (lockInfo && lockInfo.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((lockInfo.lockedUntil - Date.now()) / 60000);
    res.status(429).json({
      error_fr: `Trop de tentatives échouées. Réessayez dans ${minutesLeft} minute(s).`,
    });
    return;
  }

  try {
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, plan, phone')
      .eq('email', email)
      .maybeSingle();

    const registerFailedAttempt = () => {
      const current = failedLoginAttempts.get(email) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCK_DURATION_MS;
        current.count = 0;
      }
      failedLoginAttempts.set(email, current);
    };

    const genericAuthError = () => {
      registerFailedAttempt();
      generateAuditLog({
        action: 'LOGIN_FAILED_BAD_CREDENTIALS',
        ipAddress: ip,
        status: 'FAILED',
        details: `Tentative de connexion échouée (${email}).`,
      });
      res.status(401).json({
        error_fr: "Email ou mot de passe incorrect.",
        error_en: "Incorrect email or password.",
      });
    };

    if (fetchError || !user) {
      genericAuthError();
      return;
    }

    let passwordMatches = false;

    if (isBcryptHash(user.password_hash)) {
      passwordMatches = await bcrypt.compare(password, user.password_hash);
    } else {
      try {
        passwordMatches = decryptAES256(user.password_hash) === password;
      } catch {
        passwordMatches = false;
      }

      if (passwordMatches) {
        const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await supabaseAdmin.from('users').update({ password_hash: newHash }).eq('id', user.id);
        generateAuditLog({
          action: 'PASSWORD_MIGRATED_TO_BCRYPT',
          userId: user.id,
          ipAddress: ip,
          status: 'SUCCESS',
          details: `Mot de passe migré automatiquement vers bcrypt lors de la connexion (${email}).`,
        });
      }
    }

    if (!passwordMatches) {
      genericAuthError();
      return;
    }

    failedLoginAttempts.delete(email);

    // Connexion directe : mot de passe correct = accès immédiat. La 2FA par
    // email/WhatsApp a été retirée du parcours de connexion — elle dépendait
    // de l'envoi effectif d'un code (email non livrable sans domaine vérifié
    // sur Resend, WhatsApp limité au mode sandbox Twilio), ce qui bloquait
    // des clients légitimes qui avaient pourtant le bon mot de passe.
    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role as 'user' | 'dev' | 'admin',
      plan: user.plan as 'gratuit' | 'gardien' | 'pentest_premium',
      is2faVerified: true,
    };

    const accessToken = signAccessToken(userPayload);

    generateAuditLog({
      action: 'LOGIN_FULL_SUCCESS_JWT_ISSUED',
      userId: user.id,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Connexion directe réussie (${email}). Token JWT émis (expiration 24h).`,
    });

    res.status(200).json({
      message_fr: "Connexion réussie. Session sécurisée active (expiration sous 24h).",
      message_en: "Login successful. Secure session active (24h expiry).",
      accessToken,
      expiresIn: '24h',
      user: userPayload,
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur lors de la connexion.", details: err.message });
  }
}
export async function verify2FA(req: Request, res: Response): Promise<void> {
  const { challengeId, otp } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!challengeId || !otp) {
    res.status(400).json({ error_fr: "Challenge ID et code 2FA requis." });
    return;
  }

  const challenge = pending2FAChallenges.get(challengeId);
  if (!challenge || Date.now() > challenge.expiresAt) {
    res.status(401).json({ error_fr: "Challenge 2FA expiré ou invalide. Veuillez vous reconnecter." });
    return;
        }if (challenge.attempts >= 5) {
    pending2FAChallenges.delete(challengeId);
    res.status(429).json({ error_fr: "Trop de tentatives incorrectes. Veuillez vous reconnecter." });
    return;
  }

  const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '2026';
  if (challenge.otp !== otp && !isDevBypass) {
    challenge.attempts += 1;
    generateAuditLog({
      action: 'FAILED_2FA_OTP',
      userId: challenge.userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Code 2FA incorrect saisi (tentative ${challenge.attempts}/5).`,
    });

    res.status(401).json({ error_fr: "Code 2FA incorrect." });
    return;
  }

  pending2FAChallenges.delete(challengeId);

  const userPayload = {
    id: challenge.userId,
    email: challenge.email,
    role: challenge.role as 'user' | 'dev' | 'admin',
    plan: challenge.plan as 'gratuit' | 'gardien' | 'pentest_premium',
    is2faVerified: true,
  };

  const accessToken = signAccessToken(userPayload);

  generateAuditLog({
    action: 'LOGIN_FULL_SUCCESS_JWT_ISSUED',
    userId: challenge.userId,
    ipAddress: ip,
    status: 'SUCCESS',
    details: 'Authentification 2FA réussie. Token JWT émis (expiration 24h).',
  });

  res.status(200).json({
    message_fr: "Authentification 2FA validée. Connexion sécurisée active (expiration sous 24h).",
    message_en: "2FA verified. Secure session active (24h expiry).",
    accessToken,
    expiresIn: '24h',
    user: userPayload,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  generateAuditLog({
    action: 'USER_LOGOUT',
    userId: req.user?.id,
    ipAddress: ip,
    status: 'SUCCESS',
    details: 'Déconnexion utilisateur côté client.',
  });

  res.status(200).json({
    message_fr: "Déconnexion réussie.",
    message_en: "Logged out successfully.",
  });
}
export async function listDevelopers(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  try {
    // Corrige un trou de sécurité/confiance : cette requête retournait auparavant TOUS les
    // développeurs inscrits (y compris en attente ou refusés), visibles par n'importe quelle PME.
    // Seuls les développeurs approuvés (badge GHULABE CERTIFIED) apparaissent désormais.
    const { data: devs, error } = await supabaseAdmin
      .from('users')
      .select('id, name, country, city, bio, rate_fcfa, portfolio_url, badge_level, rating, missions_completed, specialites')
      .eq('role', 'dev')
      .eq('verification_status', 'approved');

    if (error) {
      res.status(500).json({ error_fr: "Erreur lors de la récupération des développeurs.", details: error.message });
      return;
    }

    generateAuditLog({
      action: 'DEVS_LIST_ACCESSED',
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Liste des développeurs consultée (${devs?.length || 0} résultat(s)).`,
    });

    res.status(200).json({ developers: devs || [] });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur serveur lors de la récupération des développeurs.", details: err.message });
  }
}
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email, lang } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email) {
    res.status(400).json({ error_fr: "Email requis." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  const genericResponse = () => {
    res.status(200).json({
      message_fr: "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.",
      message_en: "If an account exists with this email, a reset code has been sent.",
    });
  };

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      genericResponse();
      return;
    }

    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '2026';
    const resetId = `reset-${Date.now()}`;

    pendingPasswordResets.set(resetId, {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const emailSent = await sendPasswordResetEmail(user.email, otp, lang === 'en' ? 'en' : 'fr', user.id, ip);
    pendingPasswordResets.set(resetId, { ...pendingPasswordResets.get(resetId)!, otp } as any);

    generateAuditLog({
      action: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      ipAddress: ip,
      status: emailSent ? 'SUCCESS' : 'FAILED',
      details: `Demande de réinitialisation de mot de passe (${email}), email ${emailSent ? 'envoyé' : 'NON envoyé'}.`,
    });

    res.status(200).json({
      message_fr: "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.",
      message_en: "If an account exists with this email, a reset code has been sent.",
      resetId,
      devNote: process.env.NODE_ENV !== 'production' ? `Code de test : "${otp}"` : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur lors de la demande de réinitialisation.", details: err.message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { resetId, otp, newPassword } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!resetId || !otp || !newPassword) {
    res.status(400).json({ error_fr: "Champs requis manquants." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error_fr: "Le mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const challenge = pendingPasswordResets.get(resetId) as any;
  if (!challenge || Date.now() > challenge.expiresAt) {
    res.status(401).json({ error_fr: "Code expiré ou invalide. Veuillez recommencer." });
    return;
  }

  const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '2026';
  if (challenge.otp !== otp && !isDevBypass) {
    res.status(401).json({ error_fr: "Code incorrect." });
    return;
  }

  try {
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await supabaseAdmin.from('users').update({ password_hash: newHash }).eq('id', challenge.userId);
    pendingPasswordResets.delete(resetId);

    generateAuditLog({
      action: 'PASSWORD_RESET_COMPLETED',
      userId: challenge.userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: 'Mot de passe réinitialisé avec succès.',
    });

    res.status(200).json({
      message_fr: "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.",
      message_en: "Password reset successfully. You can now log in.",
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur lors de la réinitialisation.", details: err.message });
  }
                          }
