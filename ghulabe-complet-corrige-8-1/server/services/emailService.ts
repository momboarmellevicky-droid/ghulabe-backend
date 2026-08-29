import { generateAuditLog } from '../utils/crypto';
import nodemailer from 'nodemailer';

// ============================================================================
// GHULABE — ENVOI RÉEL DU CODE 2FA PAR EMAIL
// Utilise l'API HTTP de Resend (https://resend.com) au lieu de SMTP direct,
// car les connexions SMTP sortantes sont souvent bloquées sur les instances
// Render gratuites. Si RESEND_API_KEY est absente, l'envoi est simplement
// ignoré (retour false) plutôt que de faire planter la connexion — utile
// en développement local sans clé configurée.
//
// Repli SMTP (nodemailer) : Resend ne peut envoyer qu'à l'adresse email du
// propriétaire du compte tant que le domaine d'envoi (ghulabe.com) n'est pas
// vérifié (enregistrements DNS). En attendant cette vérification, un envoi
// Resend refusé (ou une clé absente) bascule automatiquement sur SMTP si les
// identifiants SMTP_HOST/SMTP_USER/SMTP_PASS sont configurés sur Render.
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'GHULABE Sécurité';

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getSmtpTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return smtpTransporter;
}

async function sendViaSmtpFallback(toEmail: string, subject: string, html: string, text: string): Promise<boolean> {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html,
      text,
    });
    return true;
  } catch {
    return false;
  }
}

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
/**
 * Email récapitulatif final envoyé à l'admin dès qu'un candidat développeur a
 * TOUT terminé (pièce d'identité + selfie + QCM) : contient les infos du
 * candidat, ses documents (liens signés valables 1h), le score QCM, et DEUX
 * boutons — "Certifier" / "Rejeter" — qui déclenchent la décision en un clic
 * sans passer par le dashboard. Chaque bouton pointe vers un jeton aléatoire
 * à usage unique, généré et stocké juste avant l'envoi de cet email.
 */
export async function sendCertificationReadyEmail(
  candidateEmail: string,
  candidateName: string,
  detailsText: string,
  approveUrl: string,
  rejectUrl: string,
  userId: string,
  ip: string
): Promise<boolean> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    generateAuditLog({
      action: 'EMAIL_CERTIFICATION_READY_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Email de certification ignoré (RESEND_API_KEY ou ADMIN_EMAIL non configuré) pour ${candidateEmail}.`,
    });
    return false;
  }

  const subject = `🎓 GHULABE — ${candidateName || candidateEmail} a terminé son parcours (identité + QCM) — décision requise`;
  const text = `${candidateName || candidateEmail}\n${detailsText}\n\nCertifier : ${approveUrl}\nRejeter : ${rejectUrl}`;
  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;max-width:560px;">
    <h2 style="color:#0066FF;">🎓 Candidat prêt pour décision</h2>
    <p><strong>${candidateName || 'Candidat'}</strong> (${candidateEmail})</p>
    <p style="color:#9CA3AF;white-space:pre-line;">${detailsText}</p>
    <div style="margin-top:24px;">
      <a href="${approveUrl}" style="display:inline-block;background:#00FF88;color:#0A0A0F;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;margin-right:12px;">✅ Certifier ce développeur</a>
      <a href="${rejectUrl}" style="display:inline-block;background:#FF4444;color:#FFFFFF;font-weight:bold;padding:14px 28px;border-radius:8px;text-decoration:none;">❌ Rejeter</a>
    </div>
    <p style="color:#6B7280;font-size:0.85em;margin-top:20px;">Ces liens expirent dans 7 jours et ne fonctionnent qu'une seule fois. Pour revoir les documents en détail, utilisez le dashboard admin.</p>
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
        to: [ADMIN_EMAIL],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_CERTIFICATION_READY_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi email certification pour ${candidateEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_CERTIFICATION_READY_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Email de certification (avec boutons) envoyé pour ${candidateEmail}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_CERTIFICATION_READY_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique email certification pour ${candidateEmail} : ${err.message}`,
    });
    return false;
  }
}


export async function sendAdminRecruitmentAlertEmail(
  eventLabel: string,
  candidateEmail: string,
  detailsText: string,
  userId: string,
  ip: string
): Promise<boolean> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    generateAuditLog({
      action: 'EMAIL_ADMIN_ALERT_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Alerte admin ignorée (RESEND_API_KEY ou ADMIN_EMAIL non configuré) — événement: ${eventLabel} / ${candidateEmail}.`,
    });
    return false;
  }

  // Sujet directement basé sur eventLabel (qui porte déjà l'emoji et la
  // catégorie exacte : inscription, paiement, candidature, QCM...) — plus de
  // préfixe générique "Recrutement" trompeur qui rendait tous les emails
  // indistincts dans la boîte de réception.
  const subject = `${eventLabel} — ${candidateEmail}`;
  const text = `${eventLabel}\nCandidat : ${candidateEmail}\n${detailsText}`;
  const html = `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
    <h2 style="color:#0066FF;">🔔 ${eventLabel}</h2>
    <p>Candidat : <strong>${candidateEmail}</strong></p>
    <p style="color:#9CA3AF;">${detailsText}</p>
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
        to: [ADMIN_EMAIL],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'EMAIL_ADMIN_ALERT_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi alerte admin (${eventLabel}) : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_ADMIN_ALERT_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Alerte admin envoyée (${eventLabel}) pour ${candidateEmail}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_ADMIN_ALERT_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique alerte admin (${eventLabel}) : ${err.message}`,
    });
    return false;
  }
}

/**
 * Notification au candidat développeur suite à la décision de l'admin
 * (approbation ou refus de sa candidature après le parcours de vérification).
 */
export async function sendDevDecisionEmail(
  toEmail: string,
  candidateName: string,
  approved: boolean,
  reasonText: string | undefined,
  userId: string,
  ip: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    generateAuditLog({
      action: 'EMAIL_DEV_DECISION_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Décision candidature ignorée (RESEND_API_KEY non configurée) pour ${toEmail}.`,
    });
    return false;
  }

  const subject = approved
    ? '✅ Votre candidature GHULABE a été approuvée !'
    : 'Résultat de votre candidature GHULABE';

  const text = approved
    ? `Bonjour ${candidateName},\n\nBonne nouvelle : votre candidature au portail développeurs GHULABE a été approuvée. Votre compte est désormais certifié GHULABE CERTIFIED et visible par les entreprises à la recherche d'experts en sécurité.\n\nL'équipe GHULABE`
    : `Bonjour ${candidateName},\n\nAprès examen de votre candidature au portail développeurs GHULABE, nous ne sommes pas en mesure de la valider pour le moment.${reasonText ? `\n\nMotif : ${reasonText}` : ''}\n\nVous pouvez soumettre une nouvelle candidature ultérieurement.\n\nL'équipe GHULABE`;

  const html = approved
    ? `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
        <h2 style="color:#00FF88;">✅ Candidature approuvée</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Votre candidature au portail développeurs GHULABE a été approuvée. Votre compte est désormais certifié <strong style="color:#00FF88;">GHULABE CERTIFIED</strong> et visible par les entreprises à la recherche d'experts en sécurité.</p>
        <p style="color:#9CA3AF;font-size:13px;">L'équipe GHULABE</p>
      </div>`
    : `<div style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;padding:24px;border-radius:8px;">
        <h2 style="color:#FF6B2D;">Résultat de votre candidature</h2>
        <p>Bonjour <strong>${candidateName}</strong>,</p>
        <p>Après examen de votre candidature au portail développeurs GHULABE, nous ne sommes pas en mesure de la valider pour le moment.</p>
        ${reasonText ? `<p style="color:#F3F4F6;background:#0D1B2A;padding:12px;border-radius:6px;border-left:3px solid #FF6B2D;">Motif : ${reasonText}</p>` : ''}
        <p style="color:#9CA3AF;font-size:13px;">Vous pouvez soumettre une nouvelle candidature ultérieurement.<br/>L'équipe GHULABE</p>
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
        action: 'EMAIL_DEV_DECISION_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi décision candidature à ${toEmail} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'EMAIL_DEV_DECISION_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Décision candidature (${approved ? 'approuvée' : 'refusée'}) envoyée à ${toEmail}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'EMAIL_DEV_DECISION_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique décision candidature à ${toEmail} : ${err.message}`,
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
    const subjectFallback = lang === 'en' ? 'Reset your GHULABE password' : 'Réinitialisez votre mot de passe GHULABE';
    const textFallback = lang === 'en'
      ? `Your GHULABE password reset code is: ${otp}. This code expires in 15 minutes.`
      : `Votre code de réinitialisation GHULABE est : ${otp}. Ce code expire dans 15 minutes.`;
    const htmlFallback = `<p>${textFallback}</p>`;
    const smtpSent = await sendViaSmtpFallback(toEmail, subjectFallback, htmlFallback, textFallback);
    if (smtpSent) {
      generateAuditLog({
        action: 'EMAIL_PASSWORD_RESET_SENT_VIA_SMTP_FALLBACK',
        userId,
        ipAddress: ip,
        status: 'SUCCESS',
        details: `Email reset envoyé via SMTP (RESEND_API_KEY absente) à ${toEmail}.`,
      });
      return true;
    }
    generateAuditLog({
      action: 'EMAIL_PASSWORD_RESET_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Envoi email reset ignoré (RESEND_API_KEY et SMTP non configurés) pour ${toEmail}.`,
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
      // Repli SMTP avant d'abandonner : Resend refuse souvent silencieusement
      // tant que le domaine d'envoi n'est pas vérifié (compte sans domaine).
      const smtpSent = await sendViaSmtpFallback(toEmail, subject, html, text);
      if (smtpSent) {
        generateAuditLog({
          action: 'EMAIL_PASSWORD_RESET_SENT_VIA_SMTP_FALLBACK',
          userId,
          ipAddress: ip,
          status: 'SUCCESS',
          details: `Email reset envoyé via repli SMTP (Resend refusé: ${res.status}) à ${toEmail}.`,
        });
        return true;
      }
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
