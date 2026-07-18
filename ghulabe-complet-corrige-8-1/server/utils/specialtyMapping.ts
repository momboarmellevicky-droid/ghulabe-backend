/**
 * Taxonomie des spécialités développeur GHULABE et mapping automatique
 * catégorie de faille (VulnerabilityFinding.category) → spécialité requise.
 *
 * Utilisé à deux endroits :
 * - scanController.ts : calcule required_specialites au moment de la création d'une mission
 * - missionController.ts : compare specialites du dev vs required_specialites de la mission
 */

export const SPECIALTIES = [
  'wordpress',
  'linux_serveur',
  'ssl_reseau',
  'base_donnees',
  'headers_http',
  'osint_recon',
] as const;

export type Specialty = typeof SPECIALTIES[number];

export const SPECIALTY_LABELS_FR: Record<Specialty, string> = {
  wordpress: 'WordPress / CMS',
  linux_serveur: 'Serveur Linux',
  ssl_reseau: 'SSL & Réseau',
  base_donnees: 'Base de Données',
  headers_http: 'Headers HTTP / API',
  osint_recon: 'Reconnaissance / OSINT',
};

/**
 * Mappe une catégorie brute de finding (texte libre stocké en base, ex.
 * "Chiffrement & Certificats") vers une ou plusieurs spécialités développeur.
 * Le matching est fait par mots-clés car category est du texte libre non normalisé.
 */
export function mapCategoryToSpecialties(category: string): Specialty[] {
  const c = category.toLowerCase();
  const specialties = new Set<Specialty>();

  if (c.includes('wordpress') || c.includes('cms') || c.includes('plugin')) {
    specialties.add('wordpress');
  }
  if (c.includes('serveur') || c.includes('server') || c.includes('cve') || c.includes('linux')) {
    specialties.add('linux_serveur');
  }
  if (c.includes('chiffrement') || c.includes('certificat') || c.includes('ssl') || c.includes('tls')) {
    specialties.add('ssl_reseau');
  }
  if (c.includes('base de données') || c.includes('database') || c.includes('owasp a03') || c.includes('sql')) {
    specialties.add('base_donnees');
  }
  if (c.includes('header') || c.includes('api') || c.includes('csp') || c.includes('cookie')) {
    specialties.add('headers_http');
  }
  if (c.includes('reconnaissance') || c.includes('passive') || c.includes('dns') || c.includes('fichiers sensibles')) {
    specialties.add('osint_recon');
  }

  return Array.from(specialties);
}

/**
 * Calcule la liste dédupliquée des spécialités requises pour un ensemble de findings.
 */
export function computeRequiredSpecialties(findings: { category: string }[]): Specialty[] {
  const all = new Set<Specialty>();
  for (const f of findings) {
    for (const s of mapCategoryToSpecialties(f.category)) all.add(s);
  }
  return Array.from(all);
}
