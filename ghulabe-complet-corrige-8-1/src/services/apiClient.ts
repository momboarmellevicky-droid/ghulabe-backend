import { ScanResult, Mission } from '../types';
import { MOCK_MISSIONS } from '../data/mockData';

// @ts-ignore
const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || '/api';

/**
 * Interface frontend pour communiquer avec le Backend GHULABE (Render / Supabase EU)
 */
export const GhulabeBackend = {
  /**
   * 1. Connexion Étape 1 : Valide le mot de passe et déclenche l'envoi du challenge 2FA
   */
  async loginStep1(email: string, passwordHash: string): Promise<{ challengeId: string; devNote?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: passwordHash }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error_fr || errData.error || 'Identifiants invalides ou serveur indisponible.');
    }
    return await res.json();
  },

  /**
   * 2. Connexion Étape 2 : Vérifie le code OTP 2FA et récupère le JWT (valable 24h)
   * SÉCURITÉ : aucun repli local ici. Un échec réseau ou serveur doit faire échouer la
   * connexion, jamais la faire réussir silencieusement (ancien code acceptait tout OTP
   * de 4+ caractères en cas d'erreur — faille corrigée le 12/07/2026).
   */
  async verify2FA(challengeId: string, otp: string): Promise<{ accessToken: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, otp }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error_fr || errData.error || 'Code 2FA invalide ou serveur indisponible.');
    }
    return await res.json();
  },

  /**
   * 3. Lance un scan externe asynchrone (moteur Nuclei + Nmap + SSL Labs API) < 60s
   */
  async startScan(url: string, legalCheckboxAccepted: boolean, token?: string): Promise<ScanResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/scan/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, legalCheckboxAccepted }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error_fr || errData.error || 'Erreur lors du scan.');
      }
      return await res.json();
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] startScan fallback local:', err.message);
      throw err;
    }
  },

  /**
   * 4. Récupère les missions visibles par l'utilisateur (filtrage par rôle géré côté backend).
   */
  async getMissions(token?: string): Promise<Mission[]> {
    if (!token) {
      console.warn('[GHULABE Backend Wrapper] getMissions: aucun token de session disponible, utilisation des données de démonstration.');
      return MOCK_MISSIONS;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/missions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data.missions as Mission[];
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] Erreur getMissions (repli sur données de démonstration):', err.message);
      return MOCK_MISSIONS;
    }
  },

  /**
   * 0. Inscription : crée le compte côté backend (table users, mot de passe chiffré AES-256).
   */
  async register(email: string, password: string, name: string, country: string): Promise<{ userId: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, country }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error_fr || errData.error || 'Erreur lors de la création du compte.');
    }
    return await res.json();
  },

  /**
   * 5. Déconnexion côté backend (best-effort, pour la trace d'audit).
   */
  async logout(token: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] logout best-effort échoué (sans impact) :', err.message);
    }
  },

  /**
   * 6. Récupère domaines + alertes + nombre de scans en un seul appel.
   */
  async getDashboardData(token?: string): Promise<{ domains: any[]; alerts: any[]; scansCount: number } | null> {
    if (!token) {
      console.warn('[GHULABE Backend Wrapper] getDashboardData: aucun token de session disponible.');
      return null;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] Erreur getDashboardData:', err.message);
      return null;
    }
  },
};
