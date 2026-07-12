import { ScanResult, Mission } from '../types';

// Base URL du backend Express/Node.js (Render). En dev local, on peut la
// surcharger via VITE_API_URL ; en prod, elle pointe vers l'instance Render.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ghulabe-backend.onrender.com';

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const GhulabeBackend = {
  /**
   * Étape 1 de connexion : vérifie email/mot de passe hashé côté client,
   * renvoie un challengeId utilisé pour l'étape 2FA. En mode dev, le backend
   * peut renvoyer un devNote contenant le code de test (voir 2FA screen).
   */
  async loginStep1(email: string, passwordHash: string): Promise<{ challengeId: string; devNote?: string }> {
    return apiFetch('/api/auth/login-step1', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHash }),
    });
  },

  /**
   * Étape 2 de connexion : valide l'OTP à 6 chiffres reçu par email et
   * renvoie le vrai JWT backend (signAccessToken, 24h) + l'utilisateur.
   */
  async verify2FA(challengeId: string, otp: string): Promise<{ accessToken: string; user: any }> {
    return apiFetch('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp }),
    });
  },

  /**
   * Lance un scan externe asynchrone (moteur Nuclei + Nmap + SSL Labs API) < 60s.
   * Nécessite l'acceptation de la case légale (droits d'administrateur sur le domaine).
   * Fait l'upsert du domaine + insert du scan côté Supabase (voir scanController.ts).
   */
  async startScan(url: string, legalCheckboxAccepted: boolean, token?: string): Promise<ScanResult> {
    return apiFetch('/api/scan/start', {
      method: 'POST',
      body: JSON.stringify({ url, legalCheckboxAccepted }),
    }, token);
  },

  async getMissions(token?: string): Promise<Mission[]> {
    return apiFetch('/api/missions', { method: 'GET' }, token);
  },

  async register(email: string, password: string, name: string, country: string): Promise<{ userId: string }> {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, country }),
    });
  },

  async logout(token: string): Promise<void> {
    return apiFetch('/api/auth/logout', { method: 'POST' }, token);
  },

  /**
   * Récupère les domaines, alertes et compteur de scans réels de l'utilisateur
   * connecté. Renvoie null si pas de token ou erreur réseau : dans ce cas,
   * l'appelant garde ses valeurs mock/props existantes.
   */
  async getDashboardData(token?: string): Promise<{ domains: any[]; alerts: any[]; scansCount: number } | null> {
    if (!token) return null;
    try {
      return await apiFetch('/api/dashboard', { method: 'GET' }, token);
    } catch {
      return null;
    }
  },
};
