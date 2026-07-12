import { Language } from '../types';

export const i18n = {
  fr: {
    // Brand & Header
    appName: "GHULABE",
    tagline: "La 1ère plateforme de cybersécurité bilingue dédiée aux PME africaines",
    slogan: "Une URL. Un scan. Zéro faille cachée.",
    creator: "Créée par Mombo Armelle Vicky © 2026",
    nav: {
      home: "Accueil",
      scan: "Scanner",
      dash: "Tableau de bord",
      devs: "Développeurs",
      me: "Mon Compte"
    },
    quickScan: "Lancer un scan",
    logout: "Déconnexion",
    
    // Niveaux de danger
    severity: {
      critique: "🔴 Critique — Correction sous 24h",
      eleve: "🟠 Élevé — Correction sous 7 jours",
      moyen: "🟡 Moyen — Correction planifiée",
      faible: "🔵 Faible — Correction recommandée"
    },

    // Scan View & Consent
    scanConsentLabel: "Je certifie être le propriétaire ou l'administrateur autorisé de ce domaine et j'autorise Ghulabe à effectuer une analyse de sécurité externe. Ghulabe ne peut être tenu responsable des failles détectées non corrigées.",
    scanConsentError: "Vous devez impérativement cocher cette case pour autoriser l'analyse de sécurité externe.",
    urlInputPlaceholder: "ex: monentreprise-dakar.com",
    startScanBtn: "DÉMARRER LE SCAN INTERNE & EXTERNE (60s)",
    scanningTitle: "Analyse Engine en cours (< 60 secondes)",
    scanningSub: "Recherche de vulnérabilités via Nuclei, Nmap, SSL Labs & Security Headers API...",
    scanStep1: "Résolution DNS & Configuration serveur (SPF, DKIM, DMARC)",
    scanStep2: "Détection de ports ouverts & versions vulnérables",
    scanStep3: "Vérification des certificats SSL/TLS & En-têtes HTTP",
    scanStep4: "Recherche de fichiers sensibles exposés (.env, .git, .bak)",
    scanStep5: "Sondes XSS, Injection SQL, CSRF & corrélations CVE",
    
    // Report
    reportTitle: "Rapport d'Audit de Sécurité Bilingue",
    scoreLabel: "Score global de sécurité",
    tabCeo: "Pour le Patron / For the CEO",
    tabDev: "Pour le Développeur / For the Developer",
    downloadPdf: "Télécharger Rapport PDF Signé",
    ceoSectionTitle: "Synthèse Stratégique & Impact Business",
    devSectionTitle: "Détails Techniques & Corrections Code Exactes",
    copyCode: "Copier le correctif",
    copied: "Copié !",
    noVulnerabilities: "Aucune faille majeure détectée. Votre domaine respecte les standards GHULABE.",

    // Plans
    plansTitle: "Modèle Économique GHULABE",
    plansSub: "Des tarifs adaptés au contexte africain avec paiement en FCFA via Mobile Money ou Carte.",
    planFree: {
      name: "GRATUIT",
      price: "0 FCFA",
      period: "/mois",
      desc: "Idéal pour une première évaluation de sécurité.",
      features: [
        "1 scan de sécurité par mois",
        "Affichage du Score global (/10)",
        "Détection de base des vulnérabilités",
        "Accès à l'historique du dernier scan"
      ],
      cta: "Plan Actuel"
    },
    planGardien: {
      name: "GARDIEN",
      price: "5 000 FCFA",
      period: "/mois",
      desc: "Surveillance continue et alertes immédiates.",
      features: [
        "Surveillance automatisée 24/7",
        "Alertes immédiates par SMS & Email",
        "Rapport bilingue complet (Patron + Dev)",
        "Historique illimité des scans & tendances",
        "Vérification des en-têtes HSTS, CSP, etc."
      ],
      cta: "Souscrire au Gardien",
      popular: "RECOMMANDÉ PME"
    },
    planPentest: {
      name: "PENTEST PREMIUM",
      price: "25 000 FCFA",
      period: "/scan",
      desc: "Audit intrusif approfondi et accompagnement expert.",
      features: [
        "Test intrusif automatisé complet",
        "Validation DNS obligatoire par sécurité",
        "Rapport PDF officiel signé avec filigrane",
        "Mise en relation directe avec Développeur Certifié",
        "Assistance prioritaire 24/7"
      ],
      cta: "Commander un Pentest"
    },

    // Devs Portal
    devsTitle: "Portail des Développeurs Certifiés GHULABE",
    devsSub: "ghulabe.com/dev — Réseau d'experts AppSec, DevSecOps et Pentest en Afrique.",
    tabFindDev: "Trouver un Expert Certifié",
    tabBecomeDev: "Devenir Développeur Certifié (4 Étapes)",
    contactDev: "Contacter ce Développeur",
    mapTitle: "Présence Panafricaine & Nœuds GHULABE",
    mapSub: "Villes actives et connexions réseau à haute sécurité",
    
    // Recruitment steps
    recruitmentTitle: "Processus de Recrutement Séquentiel Strict",
    recruitmentSub: "4 étapes obligatoires — Impossible de sauter une étape.",
    step1Title: "ÉTAPE 1 : Formulaire de Candidature",
    step2Title: "ÉTAPE 2 : Frais de Dossier (5 000 FCFA)",
    step3Title: "ÉTAPE 3 : Vérification Smile Identity & Liveness",
    step4Title: "ÉTAPE 4 : Test Technique QCM (30 Questions / 45s)",
    step1Submit: "Valider ma candidature & passer au paiement",
    step2Pay: "Confirmer le paiement de 5 000 FCFA (Airtel / Moov / Carte)",
    step3Verify: "Lancer la vérification biométrique en temps réel (30s)",
    step4Start: "Démarrer le Test QCM sous surveillance Webcam",
    screenshotWarning: "⚠️ Sécurité Anti-Triche : Les captures d'écran et enregistrements d'écran sont strictement bloqués sur cette page.",

    // Mission & Chat
    missionModalTitle: "Demande de Mise en Relation",
    urgencySelect: "Niveau d'Urgence",
    budgetInput: "Budget estimé en FCFA",
    missionLegalCheckbox: "Je reconnais que Ghulabe est une plateforme de mise en relation uniquement. La prestation est conclue directement entre moi et le développeur indépendant certifié. Ghulabe ne peut être tenu responsable de l'exécution, la qualité ou les délais de la mission.",
    sendMissionBtn: "Envoyer la demande de mission",
    chatTitle: "Messagerie Sécurisée GHULABE",
    commissionNotice: "Commission Ghulabe automatique : 15%. Le développeur reçoit 85% net.",
    
    // Dashboard
    dashTitle: "Tableau de Bord & Supervision",
    domainsList: "Domaines Surveillés",
    addDomain: "Ajouter un domaine",
    alertsTitle: "Alertes de Sécurité (SMS & Email)",
    noAlerts: "Aucune alerte active. Votre infrastructure est stable.",
    
    // Me & Admin
    meTitle: "Mon Profil GHULABE",
    adminPortalBtn: "Accéder au Panneau Admin (Mombo Armelle Vicky)",
    adminTitle: "Panneau d'Administration Central — GHULABE",
    adminSub: "Réservé à Mombo Armelle Vicky uniquement. Connexion sécurisée 2FA.",

    // Legal
    legalLinks: {
      mentions: "Mentions Légales",
      privacy: "Politique de Confidentialité",
      cgu: "Con
