import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — ENVOI RÉEL DU CODE 2FA PAR EMAIL
// Utilise l'API HTTP de Resend (https://resend.com) au lieu de SMTP direct,
// car les connexions SMTP sortantes sont souvent bloquées sur les instances
// Render gratuites. Si RESEND_API_KEY est absente, l'envoi est simplement
// ignoré (retour false) plutôt que de faire planter la connexion — utile
// en développement local sans clé configurée.
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'GHULABE Sécurité';

function buildEmailContent(otp: string, lang: 'fr' | 'en'): { subject: string; html: string; text: string } {
  if (lang === 'en') {
    return {
      subject: 'Your GHULABE security code',
      text: `Your GHULABE verification code is: ${otp}\nThis code expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
        <h2 style="color:#0066FF;">GHULABE — Security verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">${otp}</p>
        <p style="color:#9CA3AF;font-size:13px;">This code expires in 5 minutes. If you did not request this, ignore this email.</p>
