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
      text: `Your GHULABE verification code is: ${otp}. This code expires in 5 minutes. If you did not request this, ignore this email.`,
      html: '<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;"><h2 style="color:#0066FF;">GHULABE — Security verification</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">' + otp + '</p><p style="color:#9CA3AF;font-size:13px;">This code expires in 5 minutes. If you did not request this, ignore this email.</p></div>',
    };
  }
  return {
    subject: 'Votre code de sécurité GHULABE',
    text: `Votre code de vérification GHULABE est : ${otp}. Ce code expire dans 5 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html: '<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;"><h2 style="color:#0066FF;">GHULABE — Vérification de sécurité</h2><p>Votre code de vérification est :</p><p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">' + otp + '</p><p style="color:#9CA3AF;font-size:13px;">Ce code expire dans 5 minutes. Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.</p></div>',
  };
}

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  lang: 'fr' | 'en',
  userId: string,
  ip: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    generateAuditLog({
      action: 'EMAIL_2FA_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Envoi 2FA ignoré (RESEND_API_KEY non configurée) pour ${toEmail}.`,
    });
    return false;
  }

  const built = buildEmailContent(otp, lang);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: [toEmail],
        subject: built.subject,
        html: built.html,
        text: built.text,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_2FA_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec de l'envoi de l'email 2FA à ${toEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

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
/**
 * Alerte email envoyée lors de la surveillance hebdomadaire GHULABE (plan Gardien)
 * quand de nouvelles failles apparaissent sur un domaine surveillé, ou que le
 * score de sécurité a chuté depuis le dernier scan.
 */
export async function sendVulnerabilityAlertEmail(
  toEmail: string,
  domainUrl: string,
  newFindingsCount: number,
  criticalCount: number,
  score: number,
  lang: 'fr' | 'en',
  userId: string,
  ip: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    generateAuditLog({
      action: 'EMAIL_MONITORING_ALERT_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Alerte surveillance ignorée (RESEND_API_KEY non configurée) pour ${toEmail}.`,
    });
    return false;
  }

  const subject = lang === 'en'
    ? `⚠️ GHULABE Alert: ${newFindingsCount} new issue(s) on ${domainUrl}`
    : `⚠️ Alerte GHULABE : ${newFindingsCount} nouvelle(s) faille(s) sur ${domainUrl}`;

  const bodyText = lang === 'en'
    ? `Your weekly GHULABE monitoring scan found ${newFindingsCount} new vulnerability(ies) on ${domainUrl} (${criticalCount} critical). Current score: ${score}/10. Log in to GHULABE to see the full report.`
    : `Votre scan de surveillance hebdomadaire GHULABE a détecté ${newFindingsCount} nouvelle(s) faille(s) sur ${domainUrl} (${criticalCount} critique(s)). Score actuel : ${score}/10. Connectez-vous à GHULABE pour voir le rapport complet.`;

  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
    <h2 style="color:#FF2D2D;">⚠️ GHULABE — ${lang === 'en' ? 'New vulnerabilities detected' : 'Nouvelles failles détectées'}</h2>
    <p>${bodyText}</p>
    <p style="font-size:28px;font-weight:bold;color:${score >= 7 ? '#00FF88' : score >= 4 ? '#FF6B2D' : '#FF2D2D'};">${score}/10</p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: [toEmail],
        subject,
        html,
        text: bodyText,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_MONITORING_ALERT_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi alerte surveillance à ${toEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_MONITORING_ALERT_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Alerte surveillance envoyée à ${toEmail} pour ${domainUrl} (${newFindingsCount} nouvelle(s) faille(s)).`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_MONITORING_ALERT_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Échec envoi alerte surveillance à ${toEmail} : ${err.message}`,
    });
    return false;
  }
}
/**
 * Alerte envoyée à l'adresse admin (ADMIN_EMAIL) dès qu'un paiement Mobile
 * Money (SingPay) est confirmé réussi — permet à l'admin de savoir qu'une
 * transaction Gardien/Pentest Premium vient d'avoir lieu sans avoir à aller
 * vérifier manuellement le Portefeuille SingPay.
 */
export async function sendAdminPaymentAlertEmail(
  amount: number,
  phoneNumber: string,
  transactionId: string,
  ip: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!RESEND_API_KEY || !adminEmail) {
    generateAuditLog({
      action: 'EMAIL_ADMIN_PAYMENT_ALERT_SKIPPED',
      userId: 'admin',
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Alerte paiement admin ignorée (RESEND_API_KEY ou ADMIN_EMAIL absent). Transaction ${transactionId}.`,
    });
    return false;
  }

  const subject = `💰 GHULABE — Paiement reçu (${amount} FCFA)`;
  const bodyText = `Un paiement de ${amount} FCFA vient d'être confirmé sur GHULABE. Numéro payeur : ${phoneNumber}. Référence transaction : ${transactionId}.`;
  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
    <h2 style="color:#00FF88;">💰 Nouveau paiement confirmé</h2>
    <p>${bodyText}</p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: [adminEmail],
        subject,
        html,
        text: bodyText,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_ADMIN_PAYMENT_ALERT_FAILED',
        userId: 'admin',
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi alerte paiement admin : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_ADMIN_PAYMENT_ALERT_SENT',
      userId: 'admin',
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Alerte paiement admin envoyée à ${adminEmail} pour transaction ${transactionId}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_ADMIN_PAYMENT_ALERT_FAILED',
      userId: 'admin',
      ipAddress: ip,
      status: 'FAILED',
      details: `Échec envoi alerte paiement admin : ${err.message}`,
    });
    return false;
  }
}

/**
 * Envoi du rapport de scan par email, réservé au plan Gardien.
 * Déclenché à chaque scan terminé (pas seulement en cas de score critique).
 */
export async function sendScanReportEmail(
  toEmail: string,
  url: string,
  score: number,
  findingsCount: number,
  reportPdfUrl: string | null,
  lang: 'fr' | 'en',
  userId: string,
  ip: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    generateAuditLog({
      action: 'SCAN_REPORT_EMAIL_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Envoi rapport email ignoré (RESEND_API_KEY non configurée) pour ${toEmail}.`,
    });
    return false;
  }

  const subject = lang === 'en'
    ? `GHULABE Scan Report — ${url} (${score}/10)`
    : `Rapport de scan GHULABE — ${url} (${score}/10)`;

  const bodyText = lang === 'en'
    ? `Your GHULABE scan for ${url} is complete. Score: ${score}/10. ${findingsCount} finding(s) detected. ${reportPdfUrl ? `Full report: ${reportPdfUrl}` : 'Report unavailable.'}`
    : `Votre scan GHULABE pour ${url} est terminé. Score : ${score}/10. ${findingsCount} faille(s) détectée(s). ${reportPdfUrl ? `Rapport complet : ${reportPdfUrl}` : 'Rapport indisponible.'}`;

  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
    <h2 style="color:#0066FF;">${lang === 'en' ? 'GHULABE Scan Report' : 'Rapport de scan GHULABE'}</h2>
    <p>${lang === 'en' ? 'Domain' : 'Domaine'} : <strong>${url}</strong></p>
    <p style="font-size:28px;font-weight:bold;color:${score >= 7 ? '#00FF88' : score >= 4 ? '#FF6B2D' : '#FF2D2D'};">${score}/10</p>
    <p>${findingsCount} ${lang === 'en' ? 'finding(s) detected' : 'faille(s) détectée(s)'}.</p>
    ${reportPdfUrl ? `<p><a href="${reportPdfUrl}" style="color:#00FF88;">${lang === 'en' ? 'Download full PDF report' : 'Télécharger le rapport PDF complet'}</a></p>` : ''}
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: [toEmail],
        subject,
        html,
        text: bodyText,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'SCAN_REPORT_EMAIL_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec de l'envoi du rapport email à ${toEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'SCAN_REPORT_EMAIL_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Rapport de scan envoyé par email à ${toEmail}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'SCAN_REPORT_EMAIL_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique lors de l'envoi du rapport email : ${err.message}`,
    });
    return false;
  }
        }
export async function sendPasswordResetEmail(
  toEmail: string,
  otp: string,
  lang: 'fr' | 'en',
  userId: string,
  ip: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    generateAuditLog({
      action: 'EMAIL_PASSWORD_RESET_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Envoi email reset ignoré (RESEND_API_KEY non configurée) pour ${toEmail}.`,
    });
    return false;
  }

  const subject = lang === 'en' ? 'Reset your GHULABE password' : 'Réinitialisez votre mot de passe GHULABE';
  const text = lang === 'en'
    ? `Your GHULABE password reset code is: ${otp}. This code expires in 15 minutes. If you did not request this, ignore this email.`
    : `Votre code de réinitialisation GHULABE est : ${otp}. Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
    <h2 style="color:#0066FF;">${lang === 'en' ? 'GHULABE — Password Reset' : 'GHULABE — Réinitialisation du mot de passe'}</h2>
    <p>${lang === 'en' ? 'Your reset code is:' : 'Votre code de réinitialisation est :'}</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#00FF88;">${otp}</p>
    <p style="color:#9CA3AF;font-size:13px;">${lang === 'en' ? 'This code expires in 15 minutes. If you did not request this, ignore this email.' : "Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."}</p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
        to: [toEmail],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_PASSWORD_RESET_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi email reset à ${toEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_PASSWORD_RESET_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Email de réinitialisation envoyé à ${toEmail}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_PASSWORD_RESET_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique lors de l'envoi de l'email reset : ${err.message}`,
    });
    return false;
  }
      }
    
