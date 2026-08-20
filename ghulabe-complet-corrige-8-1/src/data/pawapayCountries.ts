// Pays et opérateurs Mobile Money couverts par PawaPay dans la zone CFA élargie
// (hors Gabon, déjà géré via SingPay/Airtel/Moov). Codes vérifiés sur la doc
// officielle PawaPay (docs.pawapay.io/v2/docs/providers) — ne pas modifier ces
// codes sans revérifier la doc, une erreur ici fait échouer le paiement réel.
export interface PawaPayOperator {
  code: string; // correspondent PawaPay
  label: string;
}

export interface PawaPayCountry {
  isoCode: string; // pays ISO 3166-1 alpha-3 attendu par PawaPay
  labelFr: string;
  currency: string;
  operators: PawaPayOperator[];
}

export const PAWAPAY_CFA_COUNTRIES: PawaPayCountry[] = [
  {
    isoCode: 'CMR',
    labelFr: 'Cameroun',
    currency: 'XAF',
    operators: [
      { code: 'MTN_MOMO_CMR', label: 'MTN Mobile Money' },
      { code: 'ORANGE_CMR', label: 'Orange Money' },
    ],
  },
  {
    isoCode: 'CIV',
    labelFr: "Côte d'Ivoire",
    currency: 'XOF',
    operators: [
      { code: 'MTN_MOMO_CIV', label: 'MTN Mobile Money' },
      { code: 'ORANGE_CIV', label: 'Orange Money' },
      { code: 'WAVE_CIV', label: 'Wave' },
    ],
  },
  {
    isoCode: 'SEN',
    labelFr: 'Sénégal',
    currency: 'XOF',
    operators: [
      { code: 'FREE_SEN', label: 'Free Money' },
      { code: 'ORANGE_SEN', label: 'Orange Money' },
      { code: 'WAVE_SEN', label: 'Wave' },
    ],
  },
  {
    isoCode: 'COG',
    labelFr: 'Congo-Brazzaville',
    currency: 'XAF',
    operators: [
      { code: 'AIRTEL_COG', label: 'Airtel Money' },
      { code: 'MTN_MOMO_COG', label: 'MTN Mobile Money' },
    ],
  },
  {
    isoCode: 'BEN',
    labelFr: 'Bénin',
    currency: 'XOF',
    operators: [
      { code: 'MTN_MOMO_BEN', label: 'MTN Mobile Money' },
      { code: 'MOOV_BEN', label: 'Moov Money' },
    ],
  },
  {
    isoCode: 'BFA',
    labelFr: 'Burkina Faso',
    currency: 'XOF',
    operators: [
      { code: 'MOOV_BFA', label: 'Moov Money' },
      { code: 'ORANGE_BFA', label: 'Orange Money' },
    ],
  },
];
