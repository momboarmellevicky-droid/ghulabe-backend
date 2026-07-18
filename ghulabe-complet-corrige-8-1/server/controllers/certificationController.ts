import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * GET /api/public/certification/:domainId
 * Endpoint PUBLIC (pas d'auth) : permet à n'importe qui de vérifier si un domaine
 * est réellement certifié GHULABE, en cliquant sur le badge affiché sur le site de la PME.
 * C'est ce qui rend le badge crédible : il n'est pas juste une image, il pointe vers
 * une preuve vérifiable en direct depuis la base de données.
 */
export async function getPublicCertification(req: Request, res: Response): Promise<void> {
  const { domainId } = req.params;

  try {
    const { data: domain, error } = await supabaseAdmin
      .from('domains')
      .select('url, certified, certified_at, certification_score')
      .eq('id', domainId)
      .maybeSingle();

    if (error || !domain) {
      res.status(404).json({ certified: false, error_fr: 'Domaine introuvable.', error_en: 'Domain not found.' });
      return;
    }

    res.status(200).json({
      url: domain.url,
      certified: domain.certified === true,
      certified_at: domain.certified_at,
      certification_score: domain.certification_score,
      verified_by: 'GHULABE',
    });
  } catch (err: any) {
    res.status(500).json({ certified: false, error_fr: 'Erreur lors de la vérification.', details: err.message });
  }
}

/**
 * GET /api/public/certification/:domainId/badge.svg
 * Génère un badge SVG en temps réel à partir de l'état RÉEL en base (jamais une image
 * statique) : si le domaine perd sa certification lors d'un scan ultérieur, le badge
 * affiché sur le site de la PME change automatiquement dès le prochain chargement,
 * sans que personne n'ait besoin de le remplacer manuellement.
 */
export async function getCertificationBadgeSvg(req: Request, res: Response): Promise<void> {
  const { domainId } = req.params;

  const { data: domain } = await supabaseAdmin
    .from('domains')
    .select('certified, certification_score')
    .eq('id', domainId)
    .maybeSingle();

  const certified = domain?.certified === true;
  const score = domain?.certification_score ?? '—';

  const bgColor = certified ? '#00FF88' : '#666666';
  const label = certified ? 'ENTREPRISE AUDITÉE GHULABE' : 'NON CERTIFIÉ';
  const scoreText = certified ? `Score ${score}/10` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="60" viewBox="0 0 260 60">
  <rect width="260" height="60" rx="10" fill="#0A0A0F" stroke="${bgColor}" stroke-width="2"/>
  <circle cx="30" cy="30" r="14" fill="${bgColor}"/>
  <text x="30" y="35" font-family="Arial" font-size="14" font-weight="bold" fill="#0A0A0F" text-anchor="middle">${certified ? '✓' : '✕'}</text>
  <text x="54" y="26" font-family="Arial" font-size="11" font-weight="bold" fill="#FFFFFF">${label}</text>
  <text x="54" y="42" font-family="Arial" font-size="10" fill="${bgColor}">${scoreText}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0'); // toujours à jour, jamais mis en cache par le navigateur
  res.status(200).send(svg);
}
