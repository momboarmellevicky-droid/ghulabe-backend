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
      cgu: "Conditions Générales (CGU)",
      disclaimer: "Clause Non-Responsabilité Devs",
      cookies: "Politique de Cookies"
    },
    footerRights: "© 2026 GHULABE — Tous droits réservés. Créée par Mombo Armelle Vicky. Protection OAPI en cours — Toute reproduction interdite.",
    hostingBadge: "Hébergé en Europe (Render / Supabase EU) — Données conformes RGPD"
  },
  en: {
    // Brand & Header
    appName: "GHULABE",
    tagline: "The 1st bilingual cybersecurity platform dedicated to African SMEs",
    slogan: "One URL. One scan. Zero hidden vulnerability.",
    creator: "Created by Mombo Armelle Vicky © 2026",
    nav: {
      home: "Home",
      scan: "Scan",
      dash: "Dashboard",
      devs: "Developers",
      me: "My Account"
    },
    quickScan: "Start Scan",
    logout: "Log Out",
    
    // Niveaux de danger
    severity: {
      critique: "🔴 Critical — Fix within 24h",
      eleve: "🟠 High — Fix within 7 days",
      moyen: "🟡 Medium — Planned fix",
      faible: "🔵 Low — Recommended fix"
    },

    // Scan View & Consent
    scanConsentLabel: "I certify that I am the authorized owner or administrator of this domain and I authorize Ghulabe to perform an external security analysis. Ghulabe cannot be held responsible for detected unpatched vulnerabilities.",
    scanConsentError: "You must check this box to authorize external security scanning.",
    urlInputPlaceholder: "e.g., mybusiness-accra.com",
    startScanBtn: "START INTERNAL & EXTERNAL SCAN (60s)",
    scanningTitle: "Engine Analysis in progress (< 60 seconds)",
    scanningSub: "Probing vulnerabilities via Nuclei, Nmap, SSL Labs & Security Headers API...",
    scanStep1: "DNS Resolution & Server records (SPF, DKIM, DMARC)",
    scanStep2: "Open ports detection & vulnerable software versions",
    scanStep3: "SSL/TLS certificates verification & HTTP Headers",
    scanStep4: "Exposed sensitive files inspection (.env, .git, .bak)",
    scanStep5: "XSS, SQL Injection, CSRF probes & CVE correlation",
    
    // Report
    reportTitle: "Bilingual Security Audit Report",
    scoreLabel: "Global Security Score",
    tabCeo: "For the CEO / Pour le Patron",
    tabDev: "For the Developer / Pour le Développeur",
    downloadPdf: "Download Signed PDF Report",
    ceoSectionTitle: "Strategic Summary & Business Impact",
    devSectionTitle: "Technical Details & Exact Code Fixes",
    copyCode: "Copy fix code",
    copied: "Copied!",
    noVulnerabilities: "No major vulnerabilities detected. Your domain meets GHULABE standards.",

    // Plans
    plansTitle: "GHULABE Business Model",
    plansSub: "Tailored pricing for the African context with FCFA payments via Mobile Money or Card.",
    planFree: {
      name: "FREE",
      price: "0 FCFA",
      period: "/month",
      desc: "Ideal for an initial security assessment.",
      features: [
        "1 security scan per month",
        "Global Security Score (/10)",
        "Basic vulnerability detection",
        "Access to latest scan history"
      ],
      cta: "Current Plan"
    },
    planGardien: {
      name: "GARDIEN",
      price: "5,000 FCFA",
      period: "/month",
      desc: "Continuous monitoring and immediate alerts.",
      features: [
        "Automated 24/7 surveillance",
        "Immediate SMS & Email alerts",
        "Full bilingual report (CEO + Dev)",
        "Unlimited scan history & trend charts",
        "HSTS, CSP, and Security Headers check"
      ],
      cta: "Subscribe to Gardien",
      popular: "SME RECOMMENDED"
    },
    planPentest: {
      name: "PENTEST PREMIUM",
      price: "25,000 FCFA",
      period: "/scan",
      desc: "Deep automated intrusive audit and expert support.",
      features: [
        "Full automated intrusive penetration test",
        "Mandatory DNS ownership validation",
        "Signed official PDF report with watermark",
        "Direct matchmaking with Certified Developer",
        "Priority 24/7 assistance"
      ],
      cta: "Order Premium Pentest"
    },

    // Devs Portal
    devsTitle: "GHULABE Certified Developers Portal",
    devsSub: "ghulabe.com/dev — Network of AppSec, DevSecOps and Pentest experts in Africa.",
    tabFindDev: "Find a Certified Expert",
    tabBecomeDev: "Become Certified Developer (4 Steps)",
    contactDev: "Contact Developer",
    mapTitle: "Pan-African Presence & GHULABE Nodes",
    mapSub: "Active cities and high-security network connections",
    
    // Recruitment steps
    recruitmentTitle: "Strict Sequential Recruitment Process",
    recruitmentSub: "4 mandatory steps — Impossible to skip any step.",
    step1Title: "STEP 1: Application Form",
    step2Title: "STEP 2: Dossier Fee (5,000 FCFA)",
    step3Title: "STEP 3: Smile Identity & Liveness Verification",
    step4Title: "STEP 4: Technical QCM Test (30 Questions / 45s)",
    step1Submit: "Submit application & proceed to payment",
    step2Pay: "Confirm 5,000 FCFA payment (Airtel / Moov / Card)",
    step3Verify: "Start real-time biometric verification (30s)",
    step4Start: "Start QCM Test under Webcam surveillance",
    screenshotWarning: "⚠️ Anti-Cheat Security: Screenshots and screen recordings are strictly blocked on this entire page.",

    // Mission & Chat
    missionModalTitle: "Matchmaking Request",
    urgencySelect: "Urgency Level",
    budgetInput: "Estimated budget in FCFA",
    missionLegalCheckbox: "I acknowledge that Ghulabe is solely a matchmaking platform. The service agreement is concluded directly between me and the certified independent developer. Ghulabe cannot be held responsible for the execution, quality, or delivery times of the mission.",
    sendMissionBtn: "Send Mission Request",
    chatTitle: "GHULABE Secure Messaging",
    commissionNotice: "Automatic Ghulabe commission: 15%. Developer receives 85% net.",
    
    // Dashboard
    dashTitle: "Dashboard & Supervision",
    domainsList: "Monitored Domains",
    addDomain: "Add domain",
    alertsTitle: "Security Alerts (SMS & Email)",
    noAlerts: "No active alerts. Your infrastructure is stable.",
    
    // Me & Admin
    meTitle: "My GHULABE Profile",
    adminPortalBtn: "Access Admin Panel (Mombo Armelle Vicky)",
    adminTitle: "Central Administration Panel — GHULABE",
    adminSub: "Reserved exclusively for Mombo Armelle Vicky. 2FA secured.",

    // Legal
    legalLinks: {
      mentions: "Legal Notices",
      privacy: "Privacy Policy",
      cgu: "Terms of Service (ToS)",
      disclaimer: "Developer Disclaimer",
      cookies: "Cookie Policy"
    },
    footerRights: "© 2026 GHULABE — All rights reserved. Created by Mombo Armelle Vicky. OAPI protection pending — All reproduction prohibited.",
    hostingBadge: "Hosted in Europe (Render / Supabase EU) — GDPR-compliant data"
  }
};

export const getT = (lang: Language) => i18n[lang];
