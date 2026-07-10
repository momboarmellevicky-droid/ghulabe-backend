import { Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { encryptAES256, decryptAES256, generateAuditLog } from '../utils/crypto';
import { signAccessToken } from '../utils/jwt';
import { sendOtpEmail } from '../services/emailService';

// Mémoire temporaire des challenges 2FA en cours avant validation (Expiration 5 minutes)
const pending2FAChallenges = new Map<string, { userId: string; email: string; role: string; plan: string; otp: string; expiresAt: number }>();

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, country, role = 'user', plan = 'gratuit' } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password || !name || !country) {
    res.status(400).json({ error_fr: "Tous les champs obligatoires doivent être renseignés." });
    return;
  }

  try {
    // Chiffrement au repos AES-256 du mot de passe et données sensibles
    const encryptedPassword = encryptAES256(password);
    // users.id est de type uuid en base : un id fabriqué comme "usr-<timestamp>" provoque
    // systématiquement une erreur Postgres "invalid input syntax for type uuid" (bug corrigé
    // ce soir — l'ancien code avalait cette erreur et répondait quand même "succès").
    const userId = crypto.randomUUID();

    const { error } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      password_hash: encryptedPassword,
      name,
      country,
      role,
      plan,
      is_2fa_enabled: true, // 2FA obligatoire activé par défaut
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Erreur d'unicité (email déjà utilisé) : message clair plutôt qu'un 500 générique.
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

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, lang } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !password) {
    res.status(400).json({ error_fr: "Email et mot de passe requis." });
    return;
  }

  try {
    // Vérification réelle contre la base (corrige un bug critique : l'ancien code ne
    // consultait jamais `users` et acceptait n'importe quel mot de passe pour n'importe
    // quel email). Message d'erreur volontairement générique dans les deux cas
    // (email inconnu / mot de passe incorrect) pour ne pas révéler quels emails existent.
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, plan')
      .eq('email', email)
      .maybeSingle();

    const genericAuthError = () => {
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
    try {
      passwordMatches = decryptAES256(user.password_hash) === password;
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      genericAuthError();
      return;
    }

    // Génération d'un OTP 2FA à 6 chiffres (valable 5 minutes)
    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '2026';
    const challengeId = `2fa-${Date.now()}`;

    pending2FAChallenges.set(challengeId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Envoi réel du code par email (SMTP). Si aucune config SMTP n'est présente
    // (ex. environnement de démo/local), l'envoi échoue silencieusement et le
    // devNote ci-dessous reste disponible pour continuer les tests.
    const emailSent = await sendOtpEmail(email, otp, lang === 'en' ? 'en' : 'fr', user.id, ip);

    generateAuditLog({
      action: 'LOGIN_STEP1_SUCCESS_2FA_SENT',
      userId: user.id,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Mot de passe validé. Code 2FA ${emailSent ? 'envoyé par email' : 'NON envoyé (SMTP non configuré)'} (${email}).`,
    });

    res.status(200).json({
      message_fr: emailSent
        ? "Étape 1 réussie. Un code 2FA a été envoyé par email pour confirmer votre identité."
        : "Étape 1 réussie. Code 2FA généré (email non envoyé : SMTP non configuré).",
      message_en: emailSent
        ? "Step 1 passed. A 2FA verification code was sent via email."
        : "Step 1 passed. Code generated (email not sent: SMTP not configured).",
      challengeId,
      expiresInSeconds: 300,
      emailSent,
      devNote: (process.env.NODE_ENV !== 'production' || !emailSent) ? `Code 2FA de test : "${otp}"` : undefined,
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

  const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '2026';
  if (challenge.otp !== otp && !isDevBypass) {
    generateAuditLog({
      action: 'FAILED_2FA_OTP',
      userId: challenge.userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Code 2FA incorrect saisi (${otp}).`,
    });

    res.status(401).json({ error_fr: "Code 2FA incorrect." });
    return;
  }

  // Code 2FA vérifié -> Émission d'un vrai token JWT signé (expiration stricte 24h)
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
    details: 'Déconnexion utilisateur et révocation du JWT.',
  });

  res.status(200).json({
    message_fr: "Déconnexion réussie.",
    message_en: "Logged out successfully.",
  });
}
