import { VulnerabilityFinding } from '../services/geminiAnalysis';

/**
 * Compare les findings d'un nouveau scan à ceux du scan précédent pour le même
 * domaine, et retourne uniquement les failles qui n'existaient pas avant.
 * Clé de comparaison : catégorie + titre (une CVE ou un problème identique
 * gardera la même catégorie/titre d'un scan à l'autre).
 */
export function detectNewFindings(
  previousFindings: VulnerabilityFinding[],
  currentFindings: VulnerabilityFinding[]
): VulnerabilityFinding[] {
  const previousKeys = new Set(previousFindings.map((f) => `${f.category}::${f.title_fr}`));
  return currentFindings.filter((f) => !previousKeys.has(`${f.category}::${f.title_fr}`));
}
