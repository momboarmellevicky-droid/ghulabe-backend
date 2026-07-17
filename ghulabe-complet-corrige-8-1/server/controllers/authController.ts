import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase';
import { decryptAES256, generateAuditLog } from '../utils/crypto';
import { signAccessToken } from '../utils/jwt';
import { sendOtpEmail } from '../services/emailService';

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
const BCRYPT_ROUNDS = 12;

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, country, role = 'user', plan = 'gratuit', specialites = [] } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password || !name || !country) {
    res.status(400).json({ error_fr: "Tous les champs obligatoires doivent être renseignés." });
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
      role,
      plan,
      specialites: role === 'dev' ? specialites : [],
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

    res.status(201).json({
      message_fr: "Compte créé avec succès. Authentification 2FA obligatoire requise pour la connexion.",
      message_en: "Account created successfully. Mandatory 2FA required to sign in.",
      userId,
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur serveur lors de l'enregistrement.", details: err.message });
  }
}

// Un hash bcrypt commence toujours par $2a$, $2b$ ou $2y$. Tout le reste est
// considéré comme un ancien mot de passe chiffré (AES) à migrer.
function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, lang } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password) {
    res.status(400).json({ error_fr: "Email et mot de passe requis." });
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
      .select('id, email, password_hash, role, plan')
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

    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '2026';
    const challengeId = `2fa-${Date.now()}`;

    pending2FAChallenges.set(challengeId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    const emailSent = await sendOtpEmail(email, otp, lang === 'en' ? 'en' : 'fr', user.id, ip);

    if (process.env.NODE_ENV === 'production' && !emailSent) {
      generateAuditLog({
        action: 'LOGIN_STEP1_EMAIL_FAILED',
        userId: user.id,
        ipAddress: ip,
        status: 'FAILED',
        details: `Mot de passe validé mais échec d'envoi de l'email 2FA (${email}). Connexion bloquée par sécurité.`,
      });
      pending2FAChallenges.delete(challengeId);
      res.status(500).json({
        error_fr: "Impossible d'envoyer le code de vérification. Veuillez réessayer plus tard ou contacter le support.",
        error_en: "Unable to send verification code. Please try again later or contact support.",
      });
      return;
    }

    generateAuditLog({
      action: 'LOGIN_STEP1_SUCCESS_2FA_SENT',
      userId: user.id,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Mot de passe validé. Code 2FA ${emailSent ? 'envoyé par email' : 'NON envoyé (SMTP non configuré, mode dev)'} (${email}).`,
    });

    res.status(200).json({
      message_fr: emailSent
        ? "Étape 1 réussie. Un code 2FA a été envoyé par email pour confirmer votre identité."
        : "Étape 1 réussie. Code 2FA généré (email non envoyé : SMTP non configuré, environnement de développement).",
      message_en: emailSent
        ? "Step 1 passed. A 2FA verification code was sent via email."
        : "Step 1 passed. Code generated (email not sent: SMTP not configured, dev environment).",
      challengeId,
      expiresInSeconds: 300,
      emailSent,
      devNote: process.env.NODE_ENV !== 'production' ? `Code 2FA de test : "${otp}"` : undefined,
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
  }

  if (challenge.attempts >= 5) {
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
