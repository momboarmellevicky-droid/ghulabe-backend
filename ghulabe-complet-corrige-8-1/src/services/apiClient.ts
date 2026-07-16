import { ScanResult, Mission } from '../types';
import { MOCK_MISSIONS } from '../data/mockData';

// @ts-ignore
const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'https://ghulabe-backend-1.onrender.com/api';

/**
 * Interface frontend pour communiquer avec le Backend GHULABE (Render / Supabase EU)
 */
export const GhulabeBackend = {
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
      const data = await res.json();
      return {
        ...data,
        id: data.id || data.scanId,
        scan_duration_seconds: data.scan_duration_seconds ?? data.duration_seconds,
        created_at: data.created_at || new Date().toISOString(),
        status: data.status || 'completed',
      };
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] startScan fallback local:', err.message);
      throw err;
    }
  },

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
