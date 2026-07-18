import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — ENVOI RÉEL D'ALERTES WHATSAPP VIA L'API TWILIO
// Nécessite un compte Twilio avec WhatsApp activé (sandbox gratuit pour tester,
// ou numéro validé pour la production). Variables d'environnement requises :
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (ex: "whatsapp:+14155238886").
// Si l'une de ces variables est absente, l'envoi est ignoré (retour false) —
// jamais de faux succès simulé.
// ============================================================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

export async function sendWhatsAppAlert(
  toPhoneE164: string,
  message: string,
  userId: string,
  ip: string
): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    generateAuditLog({
      action: 'WHATSAPP_ALERT_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Alerte WhatsApp ignorée (Twilio non configuré) pour ${toPhoneE164}.`,
    });
    return false;
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: `whatsapp:${toPhoneE164}`,
          Body: message,
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'WHATSAPP_ALERT_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec envoi WhatsApp à ${toPhoneE164} : ${res.status} ${errorBody}`,
      });
      return false;
    }

    generateAuditLog({
      action: 'WHATSAPP_ALERT_SENT',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Alerte WhatsApp envoyée à ${toPhoneE164}.`,
    });
    return true;
  } catch (err: any) {
    generateAuditLog({
      action: 'WHATSAPP_ALERT_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Échec envoi WhatsApp à ${toPhoneE164} : ${err.message}`,
    });
    return false;
  }
}
