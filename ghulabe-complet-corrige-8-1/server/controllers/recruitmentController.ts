import { Request, Response } from 'express';
import { initiateMobileMoneyPayment, checkPaymentStatus, MobileMoneyOperator } from '../services/paymentService';
import { initiatePawaPayDeposit, checkPawaPayStatus } from '../services/pawapayService';
import { generateAuditLog } from '../utils/crypto';
import { isValidEmail, isValidPhoneNumber } from '../utils/validators';

const RECRUITMENT_FEE_FCFA = 5000;

export async function startRecruitmentPayment(req: Request, res: Response): Promise<void> {
  const { email, phoneNumber, operator } = req.body as { email: string; phoneNumber: string; operator: MobileMoneyOperator };
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !phoneNumber || !operator) {
    res.status(400).json({ error_fr: "Email, numéro de téléphone et opérateur requis." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    res.status(400).json({ error_fr: "Numéro de téléphone invalide.", error_en: "Invalid phone number." });
    return;
  }

  const result = await initiateMobileMoneyPayment({
    amount: RECRUITMENT_FEE_FCFA,
    phoneNumber,
    operator,
    reference: `recrutement-dev-${Date.now()}`,
    description: `Frais de recrutement développeur GHULABE (${email})`,
    userId: email,
    ip,
  });

  res.status(result.success ? 200 : 400).json(result);
}

export async function getRecruitmentPaymentStatus(req: Request, res: Response): Promise<void> {
  const { transactionId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  const result = await checkPaymentStatus(transactionId, 'recruitment-candidate', ip);
  res.status(result.success ? 200 : 400).json(result);
}

// ============================================================
// VÉRIFICATION RÉELLE — capture et stockage effectif des photos
// (remplace l'ancien système frontend 100% simulé)
// ============================================================

import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
import { sendAdminRecruitmentAlertEmail, sendCertificationReadyEmail } from '../services/emailService';
import { sendWhatsAppAlert } from '../services/whatsappService';

// Alerte temps réel vers TON email + TON WhatsApp (pas ceux du candidat) —
// ADMIN_EMAIL et ADMIN_WHATSAPP_E164 à configurer dans les variables d'env Render.
async function notifyAdmin(eventLabel: string, candidateEmail: string, detailsText: string, ip: string): Promise<void> {
  await sendAdminRecruitmentAlertEmail(eventLabel, candidateEmail, detailsText, 'admin-notify', ip);
  const adminPhone = process.env.ADMIN_WHATSAPP_E164;
  if (adminPhone) {
    await sendWhatsAppAlert(adminPhone, `🔔 GHULABE\n${eventLabel}\nCandidat: ${candidateEmail}\n${detailsText}`, 'admin-notify', ip);
  }
}

const ALLOWED_PHOTO_KINDS = ['id_document', 'liveness', 'qcm_snapshot'] as const;
type PhotoKind = typeof ALLOWED_PHOTO_KINDS[number];

const VERIFICATION_BUCKET = 'recruit-verification';

export async function uploadVerificationPhoto(req: Request, res: Response): Promise<void> {
  const { email, kind, imageBase64, questionIndex, lowLight } = req.body as {
    email: string;
    kind: PhotoKind;
    imageBase64: string;
    questionIndex?: number;
    lowLight?: boolean;
  };

  if (!email || !kind || !imageBase64 || !ALLOWED_PHOTO_KINDS.includes(kind)) {
    res.status(400).json({
      error_fr: "Champs requis manquants ou invalides (email, kind, imageBase64).",
      error_en: "Missing or invalid required fields (email, kind, imageBase64).",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0 || buffer.length > 3 * 1024 * 1024) {
      res.status(413).json({
        error_fr: "Image invalide ou trop volumineuse (max 3 Mo).",
        error_en: "Invalid image or too large (max 3MB).",
      });
      return;
    }

    const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const fileName = `${safeEmail}/${kind}-${Date.now()}-${crypto.randomUUID()}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(VERIFICATION_BUCKET)
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) {
      res.status(500).json({ error_fr: `Échec upload photo: ${uploadError.message}` });
      return;
    }

    const { error: dbError } = await supabaseAdmin.from('recruit_verification_photos').insert({
      candidate_email: email,
      kind,
      storage_path: fileName,
      question_index: questionIndex ?? null,
      low_light: lowLight ?? false,
    });

    if (dbError) {
      res.status(500).json({ error_fr: `Échec enregistrement métadonnées: ${dbError.message}` });
      return;
    }

    res.status(200).json({ success: true });

    // Alerte temps réel — uniquement pour identité et liveness (pas les captures QCM répétées, pour éviter le spam)
    if (kind === 'id_document') {
      await notifyAdmin('📄 Document d\'identité uploadé', email, 'Un candidat a soumis sa pièce d\'identité.', req.ip || 'unknown-ip');
    } else if (kind === 'liveness') {
      await notifyAdmin('🤳 Selfie de vérification (liveness) soumis', email, 'Preuve de vie capturée pour ce candidat.', req.ip || 'unknown-ip');
    }
  } catch (err: any) {
    res.status(500).json({ error_fr: `Erreur serveur: ${err.message || 'inconnue'}` });
  }
}

/**
 * Fin de test QCM — reçoit le score final et déclenche une alerte temps réel
 * vers l'admin (email + WhatsApp), avec mention spéciale si score suspect (100%).
 */
export async function notifyTestCompleted(req: Request, res: Response): Promise<void> {
  const { email, scorePercentage, passed } = req.body as {
    email: string;
    scorePercentage: number;
    passed: boolean;
  };

  if (!email || typeof scorePercentage !== 'number') {
    res.status(400).json({ error_fr: "Champs requis manquants (email, scorePercentage)." });
    return;
  }

  res.status(200).json({ success: true });

  // Le score n'était auparavant jamais sauvegardé nulle part : il partait uniquement
  // dans l'alerte admin puis disparaissait. Il est maintenant persisté sur le compte
  // du candidat pour que le panneau d'approbation admin puisse l'afficher.
  await supabaseAdmin
    .from('users')
    .update({ qcm_score_percentage: scorePercentage, qcm_passed: passed })
    .eq('email', email)
    .eq('role', 'dev');

  const suspicious = scorePercentage === 100;
  const label = passed ? '✅ Test QCM terminé — RÉUSSI' : '❌ Test QCM terminé — ÉCHOUÉ';
  const details = `Score : ${scorePercentage}%.` + (suspicious ? ' ⚠️ Score parfait — à vérifier manuellement.' : '');

  await notifyAdmin(label, email, details, req.ip || 'unknown-ip');

  // Le QCM est la dernière étape du parcours (info → paiement → biométrie →
  // QCM) : si l'identité et le selfie ont bien été uploadés avant, le
  // candidat est désormais prêt pour une décision. On envoie l'email
  // récapitulatif avec les deux boutons de décision en un clic.
  const { data: candidate } = await supabaseAdmin
    .from('users')
    .select('id, name, country, city, specialites, rate_fcfa, portfolio_url')
    .eq('email', email)
    .eq('role', 'dev')
    .maybeSingle();

  const { count: photoCount } = await supabaseAdmin
    .from('recruit_verification_photos')
    .select('id', { count: 'exact', head: true })
    .eq('candidate_email', email);

  if (candidate && photoCount && photoCount > 0) {
    const approveToken = crypto.randomBytes(32).toString('hex');
    const rejectToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('users')
      .update({
        admin_approve_token: approveToken,
        admin_reject_token: rejectToken,
        admin_action_token_expires_at: expiresAt,
      })
      .eq('id', candidate.id);

    // Liens directs vers les photos d'identité et de selfie (1h, cohérent
    // avec le délai de revue rapide d'Amy) : Amy vérifie le document
    // directement depuis l'email, sans avoir besoin d'ouvrir le dashboard
    // admin séparément.
    const { data: photos } = await supabaseAdmin
      .from('recruit_verification_photos')
      .select('kind, storage_path, created_at')
      .eq('candidate_email', email)
      .in('kind', ['id_document', 'liveness'])
      .order('created_at', { ascending: true });

    const photoLinks: string[] = [];
    for (const photo of photos || []) {
      const { data: signed } = await supabaseAdmin.storage
        .from(VERIFICATION_BUCKET)
        .createSignedUrl(photo.storage_path, 3600);
      if (signed?.signedUrl) {
        const label = photo.kind === 'id_document' ? "Pièce d'identité" : 'Selfie';
        photoLinks.push(`${label} : ${signed.signedUrl}`);
      }
    }
    const photosText = photoLinks.length > 0
      ? photoLinks.join(' | ')
      : 'Documents reçus mais liens indisponibles (voir dashboard).';

    const BACKEND_URL = process.env.BACKEND_URL || 'https://ghulabe-backend-1.onrender.com';
    const summary = `Pays: ${candidate.country || 'n/a'} | Ville: ${candidate.city || 'n/a'} | Spécialités: ${(candidate.specialites || []).join(', ') || 'n/a'} | Tarif: ${candidate.rate_fcfa ? candidate.rate_fcfa + ' FCFA' : 'n/a'} | Portfolio: ${candidate.portfolio_url || 'n/a'} | Score QCM: ${scorePercentage}%${suspicious ? ' (⚠️ 100% — à vérifier)' : ''}\n\n${photosText}\n(Liens photos valables 1h)`;

    await sendCertificationReadyEmail(
      email,
      candidate.name || '',
      summary,
      `${BACKEND_URL}/api/admin-actions/certify-developer?token=${approveToken}`,
      `${BACKEND_URL}/api/admin-actions/reject-developer?token=${rejectToken}`,
      'admin-notify',
      req.ip || 'unknown-ip'
    );
  }
}

export async function getVerificationPhotos(req: Request, res: Response): Promise<void> {
  const { email } = req.params;

  const { data, error } = await supabaseAdmin
    .from('recruit_verification_photos')
    .select('*')
    .eq('candidate_email', email)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error_fr: `Erreur récupération: ${error.message}` });
    return;
  }

  const withUrls = await Promise.all(
    (data || []).map(async (row: any) => {
      const { data: signed } = await supabaseAdmin.storage
        .from(VERIFICATION_BUCKET)
        .createSignedUrl(row.storage_path, 3600);
      return { ...row, signedUrl: signed?.signedUrl || null };
    })
  );

  res.status(200).json({ success: true, photos: withUrls });
}

// ============================================================
// PAIEMENT ZONE CFA ÉLARGIE (hors Gabon) POUR LE RECRUTEMENT —
// complément public à startRecruitmentPayment (SingPay), pour les candidats
// hors Gabon qui n'ont ni Airtel Money ni Moov Money Gabon. Pas d'auth requise :
// le candidat n'a pas encore de compte à ce stade du parcours (même logique
// que startRecruitmentPayment).
// ============================================================

export async function startRecruitmentPawaPayPayment(req: Request, res: Response): Promise<void> {
  const { email, amount, currency, phoneNumber, country, correspondent } = req.body as {
    email: string; amount: number; currency: string; phoneNumber: string; country: string; correspondent: string;
  };
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !amount || !currency || !phoneNumber || !country || !correspondent) {
    res.status(400).json({ error_fr: "Paramètres de paiement incomplets." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error_fr: "Adresse email invalide.", error_en: "Invalid email address." });
    return;
  }

  const result = await initiatePawaPayDeposit({
    amount,
    currency,
    phoneNumber,
    country,
    correspondent,
    reference: `recrutement-dev-${Date.now()}`,
    description: `Frais de recrutement développeur GHULABE (${email})`,
    userId: email,
    ip,
  });

  res.status(result.success ? 200 : 400).json(result);
}

export async function getRecruitmentPawaPayStatus(req: Request, res: Response): Promise<void> {
  const { depositId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  const result = await checkPawaPayStatus(depositId, 'recruitment-candidate', ip);
  res.status(result.success ? 200 : 400).json(result);
}
