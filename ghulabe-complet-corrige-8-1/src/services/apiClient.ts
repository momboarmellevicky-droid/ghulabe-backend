import { ScanResult, Mission } from '../types';
import { MOCK_MISSIONS } from '../data/mockData';

// @ts-ignore
const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'https://ghulabe-backend-1.onrender.com/api';

/**
 * Interface frontend pour communiquer avec le Backend GHULABE (Render / Supabase EU)
 */
export const GhulabeBackend = {
  async login(email: string, password: string): Promise<{ accessToken: string; user: any }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error_fr || errData.error || 'Identifiants invalides ou serveur indisponible.');
    }
    return await res.json();
  },async forgotPassword(email: string, lang: 'fr' | 'en' = 'fr'): Promise<{ resetId?: string; devNote?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, lang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.error || 'Erreur lors de la demande de réinitialisation.');
    }
    return data;
  },

  async resetPassword(resetId: string, otp: string, newPassword: string): Promise<{ message_fr: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetId, otp, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.error || 'Erreur lors de la réinitialisation.');
    }
    return data;
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

  async startScan(url: string, legalCheckboxAccepted: boolean, token?: string, contactEmail?: string, contactPhone?: string): Promise<ScanResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/scan/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, legalCheckboxAccepted, contactEmail, contactPhone }),
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

  async register(email: string, password: string, name: string, country: string, phone: string): Promise<{ userId: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, country, phone }),
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

  async initiatePayment(
    params: { amount: number; phoneNumber: string; operator: 'airtel' | 'moov'; reference: string; description?: string },
    token: string
  ): Promise<{ success: boolean; transactionId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/payment/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors du paiement.');
    }
    return data;
  },

  async checkPaymentStatus(
    transactionId: string,
    token: string
  ): Promise<{ success: boolean; transactionId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors de la vérification du statut.');
    }
    return data;
  },

  // Paiement zone CFA élargie (hors Gabon) via PawaPay — complément à SingPay,
  // pour les pays où les clients n'ont ni Airtel Money ni Moov Money Gabon
  // (Cameroun, Côte d'Ivoire, Sénégal, Congo-Brazzaville, Bénin, Burkina Faso).
  async initiatePawaPayPayment(
    params: { amount: number; currency: string; phoneNumber: string; country: string; correspondent: string; reference: string; description?: string },
    token: string
  ): Promise<{ success: boolean; depositId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/pawapay/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors du paiement.');
    }
    return data;
  },

  async checkPawaPayStatus(
    depositId: string,
    token: string
  ): Promise<{ success: boolean; depositId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/pawapay/status/${depositId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors de la vérification du statut.');
    }
    return data;
  },

  // Variante SANS authentification, pour le paiement de candidature développeur
  // (le candidat n'a pas encore de compte à ce stade du parcours).
  async initiateRecruitmentPawaPayPayment(
    params: { email: string; amount: number; currency: string; phoneNumber: string; country: string; correspondent: string }
  ): Promise<{ success: boolean; depositId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/recruitment/pawapay-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors du paiement.');
    }
    return data;
  },

  async checkRecruitmentPawaPayStatus(
    depositId: string
  ): Promise<{ success: boolean; depositId?: string; status: string; message_fr: string; message_en: string }> {
    const res = await fetch(`${API_BASE_URL}/recruitment/pawapay-status/${depositId}`, {
      method: 'GET',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || data.message_fr || 'Erreur lors de la vérification du statut.');
    }
    return data;
  },

  async getPendingApps(token?: string): Promise<any[]> {
    if (!token) {
      console.warn('[GHULABE Backend Wrapper] getPendingApps: aucun token de session disponible.');
      return [];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pending-apps`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn('[GHULABE Backend Wrapper] getPendingApps: erreur serveur, repli sur liste vide.');
        return [];
      }
      const data = await res.json();
      return data.applications || [];
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] getPendingApps fallback local:', err.message);
      return [];
    }
  },
  async updateAppStatus(id: string, status: 'approved' | 'rejected', token: string, reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/pending-apps/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || 'Erreur lors de la mise à jour du statut.');
    }
    return data.application;
  }, 
  async requestAdminOtp(token: string): Promise<{ message_fr: string; emailSent: boolean }> {
      const res = await fetch(`${API_BASE_URL}/admin/request-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error_fr || 'Erreur lors de la demande de code.');
      }
      return data;
    },

    async verifyAdminOtp(otp: string, token: string): Promise<{ verified: boolean }> {
      const res = await fetch(`${API_BASE_URL}/admin/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error_fr || 'Code incorrect.');
      }
      return data;
    },
  async getDevList(token?: string): Promise<any[]> {
    if (!token) {
      console.warn('[GHULABE Backend Wrapper] getDevList: aucun token de session disponible.');
      return [];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dev-list`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn('[GHULABE Backend Wrapper] getDevList: erreur serveur, repli sur liste vide.');
        return [];
      }
      const data = await res.json();
      return data.developers || [];
    } catch (err: any) {
      console.warn('[GHULABE Backend Wrapper] getDevList fallback local:', err.message);
      return [];
    }
  },

  async toggleSuspendDev(id: string, suspend: boolean, token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/dev-list/${id}/suspend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ suspend }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error_fr || 'Erreur lors de la mise à jour du statut.');
    }
    return data.developer;
  },
};
