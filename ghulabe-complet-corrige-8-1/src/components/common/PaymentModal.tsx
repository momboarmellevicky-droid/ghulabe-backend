import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../../types';
import { GhulabeBackend } from '../../services/apiClient';
import { X, Smartphone, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';

interface PaymentModalProps {
  lang: Language;
  targetPlan: 'gardien' | 'pentest_premium';
  accessToken: string;
  onClose: () => void;
  onSuccess: (plan: 'gardien' | 'pentest_premium') => void;
}

const PLAN_INFO: Record<'gardien' | 'pentest_premium', { amount: number; label_fr: string; label_en: string }> = {
  gardien: { amount: 5000, label_fr: 'Offre GARDIEN', label_en: 'GARDIEN plan' },
  pentest_premium: { amount: 25000, label_fr: 'PENTEST PREMIUM', label_en: 'PENTEST PREMIUM' },
};

type Phase = 'form' | 'pending' | 'success' | 'failed';

export const PaymentModal: React.FC<PaymentModalProps> = ({ lang, targetPlan, accessToken, onClose, onSuccess }) => {
  const [operator, setOperator] = useState<'airtel' | 'moov'>('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const pollRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  const plan = PLAN_INFO[targetPlan];

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  const pollStatus = (txId: string) => {
    attemptsRef.current += 1;
    GhulabeBackend.checkPaymentStatus(txId, accessToken)
      .then((result) => {
        if (result.status === 'success') {
          setPhase('success');
          setTimeout(() => onSuccess(targetPlan), 1200);
        } else if (result.status === 'failed') {
          setPhase('failed');
          setErrorMsg(lang === 'fr' ? result.message_fr : result.message_en);
        } else if (attemptsRef.current >= 15) {
          setPhase('failed');
          setErrorMsg(lang === 'fr'
            ? "Délai dépassé. Vérifiez si le prélèvement a eu lieu avant de réessayer."
            : "Timed out. Check whether the deduction happened before retrying.");
        } else {
          pollRef.current = window.setTimeout(() => pollStatus(txId), 4000);
        }
      })
      .catch((err: any) => {
        if (attemptsRef.current >= 15) {
          setPhase('failed');
          setErrorMsg(err.message || (lang === 'fr' ? 'Erreur de vérification du paiement.' : 'Payment verification error.'));
        } else {
          pollRef.current = window.setTimeout(() => pollStatus(txId), 4000);
        }
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPhase('pending');
    attemptsRef.current = 0;

    try {
      const result = await GhulabeBackend.initiatePayment(
        {
          amount: plan.amount,
          phoneNumber,
          operator,
          reference: `plan-${targetPlan}-${Date.now()}`,
          description: `Souscription ${plan.label_fr}`,
        },
        accessToken
      );

      if (!result.success || !result.transactionId) {
        setPhase('failed');
        setErrorMsg(lang === 'fr' ? result.message_fr : result.message_en);
        return;
      }

      setTransactionId(result.transactionId);

      if (result.status === 'success') {
        setPhase('success');
        setTimeout(() => onSuccess(targetPlan), 1200);
      } else {
        pollStatus(result.transactionId);
      }
    } catch (err: any) {
      setPhase('failed');
      setErrorMsg(err.message || (lang === 'fr' ? 'Erreur lors du paiement.' : 'Payment error.'));
    }
  };
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm glass-card rounded-2xl border border-[#0066FF]/40 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={phase === 'pending'}
          className="absolute top-3 right-3 text-gray-400 hover:text-white disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-display font-extrabold text-white mb-1">
          {lang === 'fr' ? `Souscrire : ${plan.label_fr}` : `Subscribe: ${plan.label_en}`}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {plan.amount.toLocaleString('fr-FR')} FCFA
        </p>

        {phase === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="flex bg-[#0D1B2A] p-1 rounded-xl border border-white/10 font-display font-bold text-xs">
              <button
                type="button"
                onClick={() => setOperator('airtel')}
                className={`flex-1 py-2.5 rounded-lg transition-all ${operator === 'airtel' ? 'bg-[#FF2D2D] text-white' : 'text-gray-400'}`}
              >
                Airtel Money
              </button>
              <button
                type="button"
                onClick={() => setOperator('moov')}
                className={`flex-1 py-2.5 rounded-lg transition-all ${operator === 'moov' ? 'bg-[#0066FF] text-white' : 'text-gray-400'}`}
              >
                Moov Money
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-gray-300 text-xs">
                {lang === 'fr' ? 'Numéro Mobile Money' : 'Mobile Money number'} *
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="074 XX XX XX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#0066FF]/50 text-white font-mono text-xs focus:border-[#00FF88] focus:outline-none"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-[#FF2D2D] text-xs font-bold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00FF88] text-[#0A0A0F] font-display font-extrabold text-xs uppercase tracking-wider"
            >
              {lang === 'fr' ? 'Payer maintenant' : 'Pay now'}
            </button>
          </form>
        )}

        {phase === 'pending' && (
          <div className="text-center py-6 space-y-3">
            <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin mx-auto" />
            <p className="text-sm text-gray-300">
              {lang === 'fr'
                ? 'Validez la demande de paiement reçue sur votre téléphone…'
                : 'Confirm the payment request on your phone…'}
            </p>
            {transactionId && (
              <p className="text-[10px] text-gray-500 font-mono">ID: {transactionId}</p>
            )}
          </div>
        )}

        {phase === 'success' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#00FF88] mx-auto" />
            <p className="text-sm text-[#00FF88] font-bold">
              {lang === 'fr' ? 'Paiement confirmé !' : 'Payment confirmed!'}
            </p>
          </div>
        )}

        {phase === 'failed' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#FF2D2D]/15 border border-[#FF2D2D]/40 text-[#FF2D2D] text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setPhase('form')}
              className="w-full py-3 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs font-bold"
            >
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
