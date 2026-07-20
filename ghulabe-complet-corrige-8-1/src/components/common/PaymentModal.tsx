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
