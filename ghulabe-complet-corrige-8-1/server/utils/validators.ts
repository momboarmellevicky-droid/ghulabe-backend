/**
 * Validation d'entrées réutilisable côté backend.
 * Aucune de ces vérifications n'existait auparavant : les routes ne
 * vérifiaient que la présence des champs (`!email`), pas leur format.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email.trim());
}

export function isValidPhoneNumber(phone: unknown): phone is string {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}
