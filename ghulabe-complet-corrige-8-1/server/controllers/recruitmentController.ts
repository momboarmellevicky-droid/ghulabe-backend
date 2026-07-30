import { Request, Response } from 'express';
import { initiateMobileMoneyPayment, checkPaymentStatus, MobileMoneyOperator } from '../services/paymentService';
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
  } catch (err: any) {
    res.status(500).json({ error_fr: `Erreur serveur: ${err.message || 'inconnue'}` });
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
