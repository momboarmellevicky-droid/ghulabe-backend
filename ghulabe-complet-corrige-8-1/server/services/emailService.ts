import nodemailer from 'nodemailer';
import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — ENVOI RÉEL DU CODE 2FA PAR EMAIL
// SMTP générique (pas de fournisseur imposé) : fonctionne avec une boîte
// mail LWS, Gmail, Brevo, ou tout autre compte SMTP configuré dans .env.
// Si aucune configuration SMTP n'est présente, l'envoi est simplement
// ignoré (retour false) plutôt que de faire planter la connexion — utile
// en développement local sans boîte mail configurée.
// ============================================================================

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@ghulabe.com';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'GHULABE Sécurité';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // TLS implicite sur 465, STARTTLS sur 587
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return transporter;
}

function buildEmailContent(otp: string, lang: 'fr' | 'en'): { subject: string; html: string; text: string } {
  if (lang === 'en') {
    return {
      subject: 'Your GHULABE security code',
      text: `Your GHULABE verification code is: ${otp}\nThis code expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
        <h2 style="color:#0066FF;">GHULABE — Security verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">${otp}</p>
        <p style="color:#9CA3AF;font-size:13px;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
      </div>`,
    };
  }

  return {
    subject: 'Votre code de sécurité GHULABE',
    text: `Votre code de vérification GHULABE est : ${otp}\nCe code expire dans 5 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html: `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
      <h2 style="color:#0066FF;">GHULABE — Vérification de sécurité</h2>
      <p>Votre code de vérification est :</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">${otp}</p>
      <p style="color:#9CA3AF;font-size:13px;">Ce code expire dans 5 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>`,
  };
}

/**
 * Envoie le code 2FA par email. Renvoie true si l'envoi a réussi, false sinon
 * (configuration SMTP absente ou erreur d'envoi) — ne lève jamais d'exception
 * pour ne pas bloquer le flux de connexion.
 */
export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  lang: 'fr' | 'en',
  userId: string,
  ip: string
): Promise<boolean> {
  const t = getTransporter();

  if (!t) {
    generateAuditLog({
      action: 'EMAIL_2FA_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: 'Configuration SMTP absente dans .env (SMTP_HOST/SMTP_USER/SMTP_PASS). Email 2FA non envoyé.',
    });
    return false;
  }

  const { subject, html, text } = buildEmailContent(otp, lang);

  try {
    await t.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: toEmail,
      subject,
      text,
      html,
    });

    generateAuditLog({
      action: 'EMAIL_2FA_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Code 2FA envoyé par email à ${toEmail}.`,
    });

    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_2FA_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Échec de l'envoi de l'email 2FA à ${toEmail} : ${err.message}`,
    });

    return false;
  }
}
