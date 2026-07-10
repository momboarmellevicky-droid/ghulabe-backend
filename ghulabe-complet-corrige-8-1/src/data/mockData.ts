import { Developer, QCMQuestion, ScanResult, Mission, Message, Alert } from '../types';

export const QCM_QUESTIONS: QCMQuestion[] = [
  // BLOC A — LECTURE DE RAPPORT (8 questions)
  {
    id: 1,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Rapport : SQL Injection (Critique), HSTS manquant (Élevé), Cookie sans flag Secure (Moyen). Par laquelle commencer ?",
    questionEn: "Report: SQL Injection (Critical), missing HSTS (High), Cookie without Secure flag (Medium). Which to start with?",
    optionsFr: [
      "HSTS manquant",
      "Cookie sans flag Secure",
      "SQL Injection",
      "Les trois simultanément"
    ],
    optionsEn: [
      "Missing HSTS",
      "Cookie without Secure flag",
      "SQL Injection",
      "All three simultaneously"
    ],
    correctOptionIndex: 2
  },
  {
    id: 2,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Site noté 3.2/10. Cela signifie :",
    questionEn: "Site scored 3.2/10. This means:",
    optionsFr: [
      "Site légèrement vulnérable",
      "Site en danger immédiat, corriger sous 24h",
      "Score normal pour petit site",
      "Site a 3 failles mineures"
    ],
    optionsEn: [
      "Site slightly vulnerable",
      "Site in immediate danger, fix within 24h",
      "Normal score for a small website",
      "Site has 3 minor vulnerabilities"
    ],
    correctOptionIndex: 1
  },
  {
    id: 3,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "X-Frame-Options manquant. Risque principal ?",
    questionEn: "Missing X-Frame-Options. Main risk?",
    optionsFr: [
      "Vol de mot de passe",
      "Clickjacking — attaquant superpose fausse page",
      "Injection SQL",
      "Fuite d'emails"
    ],
    optionsEn: [
      "Password theft",
      "Clickjacking — attacker overlays fake page",
      "SQL Injection",
      "Email leaks"
    ],
    correctOptionIndex: 1
  },
  {
    id: 4,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Certificat SSL expire dans 3 jours. Urgence ?",
    questionEn: "SSL Certificate expires in 3 days. Urgency?",
    optionsFr: [
      "Faible — encore 3 jours",
      "Moyenne — corriger cette semaine",
      "Critique — corriger dans les heures",
      "Aucune urgence si site petit"
    ],
    optionsEn: [
      "Low — still 3 days left",
      "Medium — fix this week",
      "Critical — fix within hours",
      "No urgency if website is small"
    ],
    correctOptionIndex: 2
  },
  {
    id: 5,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Fichier .env exposé publiquement. Contient ?",
    questionEn: "Publicly exposed .env file. Contains?",
    optionsFr: [
      "Images du site",
      "Clés API, mots de passe DB, secrets JWT",
      "Code CSS",
      "Articles blog"
    ],
    optionsEn: [
      "Website images",
      "API keys, DB passwords, JWT secrets",
      "CSS code",
      "Blog articles"
    ],
    correctOptionIndex: 1
  },
  {
    id: 6,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "CSP manquante. Que peut faire un attaquant ?",
    questionEn: "Missing CSP. What can an attacker do?",
    optionsFr: [
      "Accéder aux fichiers serveur",
      "Injecter des scripts malveillants dans les pages",
      "Copier la base de données",
      "Bloquer le site"
    ],
    optionsEn: [
      "Access server files",
      "Inject malicious scripts into pages",
      "Copy the database",
      "Block the website"
    ],
    correctOptionIndex: 1
  },
  {
    id: 7,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Ports ouverts inutilisés (Moyen) et Apache 2.2 obsolète (Élevé). Corriger lequel en premier ?",
    questionEn: "Unused open ports (Medium) and obsolete Apache 2.2 (High). Which to fix first?",
    optionsFr: [
      "Ports ouverts",
      "Apache obsolète",
      "Les deux simultanément",
      "Aucun"
    ],
    optionsEn: [
      "Open ports",
      "Obsolete Apache",
      "Both simultaneously",
      "Neither"
    ],
    correctOptionIndex: 1
  },
  {
    id: 8,
    block: 'A',
    blockTitleFr: "BLOC A — LECTURE DE RAPPORT",
    blockTitleEn: "BLOCK A — REPORT READING",
    questionFr: "Permissions-Policy manquant. Quel équipement du visiteur peut être activé sans accord ?",
    questionEn: "Missing Permissions-Policy. Which visitor device can be activated without consent?",
    optionsFr: [
      "Clavier",
      "Caméra, microphone, géolocalisation",
      "Écran",
      "Connexion internet"
    ],
    optionsEn: [
      "Keyboard",
      "Camera, microphone, geolocation",
      "Screen",
      "Internet connection"
    ],
    correctOptionIndex: 1
  },

  // BLOC B — IDENTIFICATION DE FAILLES (8 questions)
  {
    id: 9,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Formulaire accepte : ' OR '1'='1. Quelle faille ?",
    questionEn: "Form accepts: ' OR '1'='1. Which vulnerability?",
    optionsFr: [
      "XSS",
      "CSRF",
      "Injection SQL",
      "Clickjacking"
    ],
    optionsEn: [
      "XSS",
      "CSRF",
      "SQL Injection",
      "Clickjacking"
    ],
    correctOptionIndex: 2
  },
  {
    id: 10,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Header HTTP : Server: Apache/2.2.14. Problème ?",
    questionEn: "HTTP Header: Server: Apache/2.2.14. Problem?",
    optionsFr: [
      "Aucun problème",
      "Version serveur exposée — attaquant connaît les failles",
      "Apache non sécurisé",
      "Header mal formaté"
    ],
    optionsEn: [
      "No problem",
      "Server version exposed — attacker knows vulnerabilities",
      "Unsecure Apache",
      "Malformed header"
    ],
    correctOptionIndex: 1
  },
  {
    id: 11,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Cookie : Set-Cookie: session=abc123. Que manque-t-il ?",
    questionEn: "Cookie: Set-Cookie: session=abc123. What is missing?",
    optionsFr: [
      "Nom du cookie",
      "Flags Secure et HttpOnly",
      "Valeur du cookie",
      "Rien"
    ],
    optionsEn: [
      "Cookie name",
      "Secure and HttpOnly flags",
      "Cookie value",
      "Nothing"
    ],
    correctOptionIndex: 1
  },
  {
    id: 12,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Site HTTP demande un mot de passe. Risque ?",
    questionEn: "HTTP site asks for a password. Risk?",
    optionsFr: [
      "Mot de passe trop court",
      "Données transmises en clair, interceptables",
      "Site lent",
      "Navigateur bloque"
    ],
    optionsEn: [
      "Password too short",
      "Data transmitted in plaintext, interceptable",
      "Slow site",
      "Browser blocks"
    ],
    correctOptionIndex: 1
  },
  {
    id: 13,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Fichier .git accessible à la racine. Que récupère un attaquant ?",
    questionEn: ".git file accessible at web root. What can an attacker retrieve?",
    optionsFr: [
      "Images seulement",
      "Historique code source, clés API commitées",
      "README seulement",
      "Rien d'important"
    ],
    optionsEn: [
      "Images only",
      "Source code history, committed API keys",
      "README only",
      "Nothing important"
    ],
    correctOptionIndex: 1
  },
  {
    id: 14,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "URL : site.com/page?id=12. Faille potentielle ?",
    questionEn: "URL: site.com/page?id=12. Potential vulnerability?",
    optionsFr: [
      "XSS",
      "Injection SQL via paramètre id",
      "CSRF",
      "Clickjacking"
    ],
    optionsEn: [
      "XSS",
      "SQL Injection via id parameter",
      "CSRF",
      "Clickjacking"
    ],
    correctOptionIndex: 1
  },
  {
    id: 15,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "Formulaire affiche : MySQL Error: Table users doesnt exist. Que révèle cela ?",
    questionEn: "Form displays: MySQL Error: Table users doesnt exist. What does this reveal?",
    optionsFr: [
      "Formulaire mal conçu",
      "Base de données exposée — erreurs ne doivent jamais s'afficher",
      "Serveur hors ligne",
      "Message normal"
    ],
    optionsEn: [
      "Poorly designed form",
      "Exposed database — errors should never be displayed",
      "Server offline",
      "Normal message"
    ],
    correctOptionIndex: 1
  },
  {
    id: 16,
    block: 'B',
    blockTitleFr: "BLOC B — IDENTIFICATION DE FAILLES",
    blockTitleEn: "BLOCK B — VULNERABILITY IDENTIFICATION",
    questionFr: "HSTS absent sur site HTTPS. Que peut faire un attaquant ?",
    questionEn: "Missing HSTS on HTTPS site. What can an attacker do?",
    optionsFr: [
      "Voler les images",
      "Forcer le navigateur à utiliser HTTP non sécurisé",
      "Modifier le contenu",
      "Bloquer l'accès"
    ],
    optionsEn: [
      "Steal images",
      "Force browser to downgrade to unsecure HTTP",
      "Modify content",
      "Block access"
    ],
    correctOptionIndex: 1
  },

  // BLOC C — CORRECTION TECHNIQUE (8 questions)
  {
    id: 17,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Activer HSTS sur Apache dans .htaccess ?",
    questionEn: "Enable HSTS on Apache in .htaccess?",
    optionsFr: [
      "Header set X-Frame-Options DENY",
      "Header always set Strict-Transport-Security max-age=31536000",
      "Header set Content-Security-Policy default-src self",
      "Header set X-Content-Type-Options nosniff"
    ],
    optionsEn: [
      "Header set X-Frame-Options DENY",
      "Header always set Strict-Transport-Security max-age=31536000",
      "Header set Content-Security-Policy default-src self",
      "Header set X-Content-Type-Options nosniff"
    ],
    correctOptionIndex: 1
  },
  {
    id: 18,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Corriger X-Frame-Options sur Nginx ?",
    questionEn: "Fix X-Frame-Options on Nginx?",
    optionsFr: [
      "add_header X-XSS-Protection 1 mode=block",
      "add_header X-Frame-Options SAMEORIGIN",
      "add_header Strict-Transport-Security max-age=31536000",
      "add_header Content-Type text/html"
    ],
    optionsEn: [
      "add_header X-XSS-Protection 1 mode=block",
      "add_header X-Frame-Options SAMEORIGIN",
      "add_header Strict-Transport-Security max-age=31536000",
      "add_header Content-Type text/html"
    ],
    correctOptionIndex: 1
  },
  {
    id: 19,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Configuration cookie de session sécurisé ?",
    questionEn: "Secure session cookie configuration?",
    optionsFr: [
      "Set-Cookie: session=abc123; Path=/",
      "Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Strict",
      "Set-Cookie: session=abc123; Expires=2026",
      "Set-Cookie: session=abc123; Public"
    ],
    optionsEn: [
      "Set-Cookie: session=abc123; Path=/",
      "Set-Cookie: session=abc123; Secure; HttpOnly; SameSite=Strict",
      "Set-Cookie: session=abc123; Expires=2026",
      "Set-Cookie: session=abc123; Public"
    ],
    correctOptionIndex: 1
  },
  {
    id: 20,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Prévenir injection SQL en PHP ?",
    questionEn: "Prevent SQL Injection in PHP?",
    optionsFr: [
      "Filtrer les espaces dans les inputs",
      "Requêtes préparées avec PDO ou MySQLi",
      "Mettre formulaire en POST",
      "Chiffrer mot de passe DB"
    ],
    optionsEn: [
      "Filter spaces in inputs",
      "Prepared statements with PDO or MySQLi",
      "Put form in POST mode",
      "Encrypt DB password"
    ],
    correctOptionIndex: 1
  },
  {
    id: 21,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Fichier .env exposé. Première action ?",
    questionEn: "Exposed .env file. First action?",
    optionsFr: [
      "Supprimer le fichier",
      "Bloquer accès via .htaccess ET changer immédiatement toutes les clés et mots de passe exposés",
      "Renommer le fichier",
      "Contacter l'hébergeur"
    ],
    optionsEn: [
      "Delete the file",
      "Block access via .htaccess AND immediately rotate all exposed keys and passwords",
      "Rename the file",
      "Contact the hosting provider"
    ],
    correctOptionIndex: 1
  },
  {
    id: 22,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Corriger faille XSS dans un formulaire ?",
    questionEn: "Fix XSS vulnerability in a form?",
    optionsFr: [
      "Limiter longueur des champs",
      "Échapper les entrées avec htmlspecialchars()",
      "Mettre en HTTPS",
      "Ajouter captcha"
    ],
    optionsEn: [
      "Limit field length",
      "Escape inputs with htmlspecialchars()",
      "Switch to HTTPS",
      "Add captcha"
    ],
    correctOptionIndex: 1
  },
  {
    id: 23,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Port 3306 MySQL ouvert publiquement. Que faire ?",
    questionEn: "MySQL Port 3306 publicly open. What to do?",
    optionsFr: [
      "Changer le port MySQL",
      "Fermer dans le pare-feu, autoriser connexions locales",
      "Mettre mot de passe fort MySQL",
      "Désinstaller MySQL"
    ],
    optionsEn: [
      "Change MySQL port",
      "Close in firewall, restrict to localhost connections",
      "Set strong MySQL password",
      "Uninstall MySQL"
    ],
    correctOptionIndex: 1
  },
  {
    id: 24,
    block: 'C',
    blockTitleFr: "BLOC C — CORRECTION TECHNIQUE",
    blockTitleEn: "BLOCK C — TECHNICAL CORRECTION",
    questionFr: "Mettre à jour Apache 2.2 sur Ubuntu ?",
    questionEn: "Update Apache 2.2 on Ubuntu?",
    optionsFr: [
      "apache update",
      "sudo apt-get update && sudo apt-get upgrade apache2",
      "apache2 --upgrade",
      "sudo install apache2 --latest"
    ],
    optionsEn: [
      "apache update",
      "sudo apt-get update && sudo apt-get upgrade apache2",
      "apache2 --upgrade",
      "sudo install apache2 --latest"
    ],
    correctOptionIndex: 1
  },

  // BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ (6 questions)
  {
    id: 25,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Mission terminée. Client avait partagé accès serveur. Que faites-vous ?",
    questionEn: "Mission completed. Client had shared server credentials. What do you do?",
    optionsFr: [
      "Garder les accès au cas où",
      "Supprimer tous les accès immédiatement et confirmer par écrit",
      "Garder 30 jours puis supprimer",
      "Transférer à un collègue"
    ],
    optionsEn: [
      "Keep credentials just in case",
      "Delete all access immediately and confirm in writing",
      "Keep 30 days then delete",
      "Forward to a colleague"
    ],
    correctOptionIndex: 1
  },
  {
    id: 26,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Vous découvrez données bancaires non chiffrées. Hors mission. Que faites-vous ?",
    questionEn: "You discover unencrypted banking data. Out of scope. What do you do?",
    optionsFr: [
      "Ignorer — hors mission",
      "Alerter immédiatement le client via messagerie Ghulabe",
      "Corriger vous-même sans prévenir",
      "Signaler à la presse"
    ],
    optionsEn: [
      "Ignore — out of scope",
      "Alert the client immediately via Ghulabe messaging",
      "Fix it yourself without warning",
      "Report to the press"
    ],
    correctOptionIndex: 1
  },
  {
    id: 27,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Client demande scanner site concurrent. Que faites-vous ?",
    questionEn: "Client requests scanning a competitor website. What do you do?",
    optionsFr: [
      "Accepter si tarif bon",
      "Refuser — scanner sans autorisation est illégal",
      "Accepter discrètement",
      "Demander accord Ghulabe"
    ],
    optionsEn: [
      "Accept if price is good",
      "Refuse — scanning without authorization is illegal",
      "Accept discreetly",
      "Ask Ghulabe approval"
    ],
    correctOptionIndex: 1
  },
  {
    id: 28,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Vous trouvez données personnelles en DB. Que faites-vous ?",
    questionEn: "You find personal data in DB. What do you do?",
    optionsFr: [
      "Copier pour prouver la faille",
      "Signaler la faille sans accéder ni copier les données",
      "Supprimer pour protéger",
      "Ignorer si hors mission"
    ],
    optionsEn: [
      "Copy to prove the vulnerability",
      "Report the vulnerability without accessing or copying data",
      "Delete to protect",
      "Ignore if out of scope"
    ],
    correctOptionIndex: 1
  },
  {
    id: 29,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Client menace mauvaise note si travail gratuit hors mission. Que faites-vous ?",
    questionEn: "Client threatens bad review if free out-of-scope work isn't done. What do you do?",
    optionsFr: [
      "Accepter pour éviter mauvaise note",
      "Signaler à Ghulabe via système de litige",
      "Donner mauvaise note en retour",
      "Quitter la plateforme"
    ],
    optionsEn: [
      "Accept to avoid bad review",
      "Report to Ghulabe via dispute system",
      "Give bad review in return",
      "Leave the platform"
    ],
    correctOptionIndex: 1
  },
  {
    id: 30,
    block: 'D',
    blockTitleFr: "BLOC D — ÉTHIQUE ET CONFIDENTIALITÉ",
    blockTitleEn: "BLOCK D — ETHICS AND CONFIDENTIALITY",
    questionFr: "Dev certifié Ghulabe partage données clients sur WhatsApp. Que faites-vous ?",
    questionEn: "Ghulabe certified dev shares client data on WhatsApp. What do you do?",
    optionsFr: [
      "Ignorer",
      "Signaler immédiatement à l'admin Ghulabe",
      "Quitter le groupe",
      "Avertir le dev en privé sans signaler"
    ],
    optionsEn: [
      "Ignore",
      "Report immediately to Ghulabe admin",
      "Leave the group",
      "Warn dev privately without reporting"
    ],
    correctOptionIndex: 1
  }
];

export const MOCK_DEVELOPERS: Developer[] = [
  {
    id: 'dev-libreville-1',
    name: 'Koumba Jean-Baptiste',
    email: 'jb.koumba@appsec-gabon.ga',
    country: 'Gabon',
    city: 'Libreville',
    speciality: 'AppSec',
    languages: ['Français', 'Anglais'],
    rate_fcfa: 35000,
    experience_years: 7,
    portfolio_url: 'https://github.com/koumba-security',
    bio: "Spécialiste en audit d'applications bancaires et détection de failles OWASP Top 10 pour PME en Afrique centrale.",
    badge_level: 'GHULABE EXPERT',
    rating: 4.9,
    missions_completed: 18,
    status: 'active',
    coordinates: [9.45, 0.39]
  },
  {
    id: 'dev-douala-1',
    name: 'Nguema Cédric',
    email: 'cedric.n@cyber-cameroon.cm',
    country: 'Cameroun',
    city: 'Douala',
    speciality: 'Pentest',
    languages: ['Français', 'Anglais'],
    rate_fcfa: 30000,
    experience_years: 5,
    portfolio_url: 'https://linkedin.com/in/nguema-pentest',
    bio: "Pentester offensif certifié CEH. Tests intrusifs automatisés et hardening de serveurs Linux/Apache sous LWS.",
    badge_level: 'GHULABE CERTIFIED',
    rating: 4.7,
    missions_completed: 9,
    status: 'active',
    coordinates: [9.70, 3.87]
  },
  {
    id: 'dev-dakar-1',
    name: 'Fatou Diop',
    email: 'fatoudiop@devsec-senegal.sn',
    country: 'Sénégal',
    city: 'Dakar',
    speciality: 'DevSecOps',
    languages: ['Français', 'Anglais', 'Wolof'],
    rate_fcfa: 40000,
    experience_years: 8,
    portfolio_url: 'https://gitlab.com/fdiop-sec',
    bio: "Ingénieure DevSecOps. Spécialiste intégration continue sécurisée, gestion des secrets (.env) et conformité SSL.",
    badge_level: 'GHULABE EXPERT',
    rating: 5.0,
    missions_completed: 24,
    status: 'active',
    coordinates: [-17.44, 14.69]
  },
  {
    id: 'dev-accra-1',
    name: 'Kwame Mensah',
    email: 'kwame@ghana-infosec.gh',
    country: 'Ghana',
    city: 'Accra',
    speciality: 'Network Security',
    languages: ['Anglais', 'Français'],
    rate_fcfa: 28000,
    experience_years: 4,
    portfolio_url: 'https://github.com/kwame-netsec',
    bio: "Network Security Architect. Firewall configuration, open port analysis (3306, 22), and DNS security (SPF/DKIM/DMARC).",
    badge_level: 'GHULABE CERTIFIED',
    rating: 4.6,
    missions_completed: 6,
    status: 'active',
    coordinates: [-0.19, 5.55]
  },
  {
    id: 'dev-lagos-1',
    name: 'Chidi Okafor',
    email: 'c.okafor@appsec-lagos.ng',
    country: 'Nigeria',
    city: 'Lagos',
    speciality: 'AppSec',
    languages: ['Anglais'],
    rate_fcfa: 45000,
    experience_years: 9,
    portfolio_url: 'https://chidi-infosec.io',
    bio: "Senior Application Security Engineer. Specialized in fintech APIs, SQLi remediation, and strict CORS/CSP implementation.",
    badge_level: 'GHULABE EXPERT',
    rating: 4.9,
    missions_completed: 31,
    status: 'active',
    coordinates: [3.39, 6.45]
  },
  {
    id: 'dev-casablanca-1',
    name: 'Youssef El Amrani',
    email: 'y.elamrani@cyber-maroc.ma',
    country: 'Maroc',
    city: 'Casablanca',
    speciality: 'Pentest',
    languages: ['Français', 'Anglais', 'Arabe'],
    rate_fcfa: 38000,
    experience_years: 6,
    portfolio_url: 'https://github.com/elamrani-sec',
    bio: "Pentester web & mobile. Reconnaissance externe Engine, validation HSTS/CSP et durcissement Nginx/PostgreSQL.",
    badge_level: 'GHULABE CERTIFIED',
    rating: 4.8,
    missions_completed: 11,
    status: 'active',
    coordinates: [-7.58, 33.57]
  },
  {
    id: 'dev-nairobi-1',
    name: 'Amina Ochieng',
    email: 'amina@eastafrica-sec.ke',
    country: 'Kenya',
    city: 'Nairobi',
    speciality: 'DevSecOps',
    languages: ['Anglais', 'Swahili'],
    rate_fcfa: 32000,
    experience_years: 5,
    portfolio_url: 'https://github.com/amina-ochieng',
    bio: "Cloud Security & DevSecOps specialist. Kubernetes hardening, zero-downtime SSL renewal, and Redis cache security.",
    badge_level: 'GHULABE CERTIFIED',
    rating: 4.5,
    missions_completed: 7,
    status: 'active',
    coordinates: [36.82, -1.29]
  },
  {
    id: 'dev-harare-1',
    name: 'Tendai Moyo',
    email: 't.moyo@zim-cyber.zw',
    country: 'Zimbabwe',
    city: 'Harare',
    speciality: 'AppSec',
    languages: ['Anglais', 'Shona'],
    rate_fcfa: 25000,
    experience_years: 3,
    portfolio_url: 'https://github.com/tendai-moyo',
    bio: "AppSec analyst & developer. Passionate about helping SMEs secure PHP/Node backends and eliminate XSS & CSRF risks.",
    badge_level: 'GHULABE RECRUIT',
    rating: 4.4,
    missions_completed: 2,
    status: 'active',
    coordinates: [31.05, -17.83]
  }
];

export const MOCK_SAMPLE_SCAN: ScanResult = {
  id: 'scan-sample-2026',
  domain_id: 'dom-sample-1',
  url: 'ebanking-pme-africa.sn',
  score: 3.2,
  scan_duration_seconds: 54,
  created_at: new Date().toISOString(),
  status: 'completed',
  headers_checked: {
    hsts: false,
    csp: false,
    x_frame_options: false,
    x_content_type_options: false
  },
  ssl_status: {
    valid: true,
    expires_in_days: 4,
    issuer: "Let's Encrypt Authority X3"
  },
  exposed_files: ['.env', '.git/config', 'config.php.bak'],
  findings: [
    {
      id: 'f-1',
      title_fr: "Injection SQL Critique sur le paramètre ?id= de login.php",
      title_en: "Critical SQL Injection on login.php parameter ?id=",
      severity: 'critique',
      category: "Base de Données / OWASP A03",
      cve_id: "CVE-2026-8912",
      ceo_impact_fr: "ALERTE MAXIMALE : Un attaquant externe peut extraire la totalité de votre base de données clients, mots de passe et transactions bancaires sans aucun mot de passe. Risque d'arrêt immédiat de l'activité.",
      ceo_impact_en: "MAXIMUM ALERT: An external attacker can extract your entire customer database, passwords, and banking transactions without any password. Immediate risk of business shutdown.",
      financial_risk_fr: "Pertes estimées : > 15 000 000 FCFA + Sanctions juridiques RGPD / Loi Gabonaise 001/2011",
      financial_risk_en: "Estimated losses: > 15,000,000 FCFA + Regulatory fines under OHADA / Data Protection laws",
      urgency_fr: "Correction obligatoire sous 24h. Intervenir immédiatement.",
      urgency_en: "Mandatory fix within 24h. Intervene immediately.",
      tech_details_fr: "La requête SQL en ligne 42 de login.php concatène directement $_GET['id'] sans échappement ni requête préparée. Payload testé : id=1 OR 1=1.",
      tech_details_en: "SQL query on line 42 of login.php directly concatenates $_GET['id'] without sanitization or prepared statements. Tested payload: id=1 OR 1=1.",
      remediation_lang: 'php',
      remediation_code: `// AVANT (Vulnérable) :
// $db->query("SELECT * FROM users WHERE id = " . $_GET['id']);

// APRÈS (Code Sécurisé à copier-coller) :
$stmt = $pdo->prepare('SELECT id, email, role FROM users WHERE id = :id');
$stmt->execute(['id' => $_GET['id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);`
    },
    {
      id: 'f-2',
      title_fr: "Fichier d'environnement .env exposé publiquement",
      title_en: "Environment file .env publicly exposed",
      severity: 'critique',
      category: "Fichiers Sensibles Exposés",
      cve_id: "CWE-538",
      ceo_impact_fr: "Vos secrets d'entreprise (mots de passe de base de données, clés API bancaires, clés privées de chiffrement) sont en accès libre sur internet à l'adresse ebanking-pme-africa.sn/.env.",
      ceo_impact_en: "Your company secrets (database passwords, banking API keys, private encryption keys) are publicly accessible on the internet at ebanking-pme-africa.sn/.env.",
      financial_risk_fr: "Risque de piratage total des comptes Airtel/Moov Money connectés à l'API.",
      financial_risk_en: "Risk of complete takeover of connected Airtel/Moov Money merchant accounts.",
      urgency_fr: "Bloquer l'accès sous 24h et régénérer immédiatement toutes les clés API exposées.",
      urgency_en: "Block access within 24h and immediately rotate all exposed API keys.",
      tech_details_fr: "Le serveur Nginx/Apache sert les fichiers dotfiles (.env) à la racine publique. Le scanner Nuclei a téléchargé le fichier avec un code HTTP 200 OK.",
      tech_details_en: "Nginx/Apache web server serves dotfiles (.env) from public root. Nuclei scanner downloaded the file with HTTP 200 OK status.",
      remediation_lang: 'nginx / apache',
      remediation_code: `# Règle Apache (.htaccess) à ajouter :
<FilesMatch "^\\..*">
    Require all denied
</FilesMatch>

# OU Règle Nginx (nginx.conf) :
location ~ /\\. {
    deny all;
    access_log off;
    log_not_found off;
}`
    },
    {
      id: 'f-3',
      title_fr: "Certificat SSL/TLS expirant dans 4 jours & HSTS manquant",
      title_en: "SSL/TLS Certificate expiring in 4 days & missing HSTS",
      severity: 'eleve',
      category: "Chiffrement & Certificats",
      cve_id: "CWE-319",
      ceo_impact_fr: "Dans 4 jours, les navigateurs (Chrome, Safari) afficheront un écran rouge d'alerte bloquant vos visiteurs. De plus, l'absence de HSTS permet d'intercepter les connexions en Wi-Fi public.",
      ceo_impact_en: "In 4 days, browsers (Chrome, Safari) will display a red warning screen blocking visitors. Moreover, missing HSTS allows connection interception on public Wi-Fi.",
      financial_risk_fr: "Perte immédiate de 80% du trafic client et perte de confiance critique.",
      financial_risk_en: "Immediate loss of 80% customer traffic and critical loss of trust.",
      urgency_fr: "Correction sous 7 jours. Renouvellement automatisé requis.",
      urgency_en: "Fix within 7 days. Automated renewal setup required.",
      tech_details_fr: "L'API SSL Labs rapporte l'expiration imminente du certificat Let's Encrypt. L'en-tête Strict-Transport-Security est absent des réponses HTTP.",
      tech_details_en: "SSL Labs API reports imminent expiration of Let's Encrypt cert. Strict-Transport-Security header missing from HTTP responses.",
      remediation_lang: 'bash / apache / nginx',
      remediation_code: `# 1. Renouveler SSL via Certbot (LWS / VPS) :
sudo certbot renew --dry-run

# 2. Activer HSTS (Apache .htaccess) :
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# OU sur Nginx :
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`
    },
    {
      id: 'f-4',
      title_fr: "En-têtes de Sécurité manquants (CSP, X-Frame-Options)",
      title_en: "Missing Security Headers (CSP, X-Frame-Options)",
      severity: 'moyen',
      category: "HTTP Security Headers API",
      cve_id: "CWE-1021",
      ceo_impact_fr: "Risque de Clickjacking : un pirate peut cloner visuellement votre site et superposer un bouton invisible pour détourner les paiements de vos clients.",
      ceo_impact_en: "Clickjacking risk: a hacker can visually clone your website and overlay invisible buttons to hijack customer payments.",
      financial_risk_fr: "Risque modéré de fraude au clic et d'érosion de la marque.",
      financial_risk_en: "Moderate risk of click fraud and brand erosion.",
      urgency_fr: "Correction planifiée lors du prochain cycle de mise à jour.",
      urgency_en: "Planned fix during next deployment cycle.",
      tech_details_fr: "Les en-têtes X-Frame-Options, Content-Security-Policy et X-Content-Type-Options sont vides ou non définis.",
      tech_details_en: "X-Frame-Options, Content-Security-Policy, and X-Content-Type-Options headers are empty or undefined.",
      remediation_lang: 'http',
      remediation_code: `// En-têtes de sécurité standard GHULABE à renvoyer par le serveur :
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self' https:; script-src 'self' 'unsafe-inline';
Referrer-Policy: strict-origin-when-cross-origin`
    },
    {
      id: 'f-5',
      title_fr: "Version serveur Apache 2.2.14 exposée dans l'en-tête Server",
      title_en: "Server version Apache 2.2.14 exposed in Server header",
      severity: 'faible',
      category: "Reconnaissance passive Engine",
      cve_id: "CVE-2017-15715",
      ceo_impact_fr: "Votre serveur annonce publiquement sa version exacte. Cela permet aux robots d'attaque automatisés de cibler directement les failles connues de cette ancienne version.",
      ceo_impact_en: "Your server publicly announces its exact version. This allows automated attack bots to directly target known vulnerabilities for this old version.",
      financial_risk_fr: "Faible impact direct, mais facilite la préparation d'une attaque ciblée.",
      financial_risk_en: "Low direct impact, but facilitates reconnaissance for targeted attacks.",
      urgency_fr: "Correction recommandée pour masquer la signature serveur.",
      urgency_en: "Recommended fix to hide server signature.",
      tech_details_fr: "L'en-tête HTTP 'Server: Apache/2.2.14 (Ubuntu)' divulgue l'OS et la version exacte.",
      tech_details_en: "HTTP header 'Server: Apache/2.2.14 (Ubuntu)' discloses exact OS and software release.",
      remediation_lang: 'apache',
      remediation_code: `# Dans /etc/apache2/conf-enabled/security.conf :
ServerTokens Prod
ServerSignature Off

# Redémarrer Apache :
sudo systemctl restart apache2`
    }
  ]
};

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'miss-1',
    client_id: 'usr-pme-1',
    client_name: 'Sangaré Logistique Dakar',
    developer_id: 'dev-dakar-1',
    developer_name: 'Fatou Diop',
    description: 'Correction de faille critique .env exposé et sécurisation de notre serveur Nginx hébergé sous LWS France.',
    url: 'sangare-logistique.sn',
    urgency: 'Critique',
    budget_fcfa: 60000,
    status: 'in_progress',
    legal_checkbox_accepted: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    id: 'miss-2',
    client_id: 'usr-pme-2',
    client_name: 'Banque Atlantique Express',
    developer_id: 'dev-libreville-1',
    developer_name: 'Koumba Jean-Baptiste',
    description: 'Correction Injection SQL sur portail marchand et mise en place des en-têtes HSTS & CSP obligatoires.',
    url: 'atlantique-express.ga',
    urgency: 'Élevé',
    budget_fcfa: 120000,
    status: 'completed',
    legal_checkbox_accepted: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    rating: {
      stars: 5,
      review: "Intervention ultra rapide de Jean-Baptiste en moins de 3h. Failles SQL résolues, rapport signé validé."
    }
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    mission_id: 'miss-1',
    sender_id: 'usr-pme-1',
    sender_name: 'Sangaré Logistique',
    sender_role: 'client',
    content: "Bonjour Fatou, notre scan GHULABE a détecté notre fichier .env exposé avec nos identifiants de base de données. Pouvez-vous intervenir en urgence ?",
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    id: 'msg-2',
    mission_id: 'miss-1',
    sender_id: 'dev-dakar-1',
    sender_name: 'Fatou Diop (GHULABE EXPERT)',
    sender_role: 'developer',
    content: "Bonjour ! Oui tout à fait. J'ai déjà analysé le rapport technique généré par GHULABE. Je prépare la règle de blocage Nginx et je vais faire une rotation immédiate de vos clés exposées. Connectez-moi en accès restreint temporaire.",
    created_at: new Date(Date.now() - 3600 * 1000 * 3.5).toISOString()
  },
  {
    id: 'msg-3',
    mission_id: 'miss-1',
    sender_id: 'dev-dakar-1',
    sender_name: 'Fatou Diop (GHULABE EXPERT)',
    sender_role: 'developer',
    content: "Voici le rapport intermédiaire de durcissement Nginx. Toutes les requêtes vers /.env renvoient désormais une erreur 403 Forbidden.",
    attachment_name: "Rapport-Hardening-Nginx-Ghulabe.pdf",
    attachment_url: "#",
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    domain_id: 'dom-sample-1',
    domain_url: 'ebanking-pme-africa.sn',
    severity: 'critique',
    message_fr: "⚠️ Alerte SMS/Email Gardien : Fichier .env détecté publiquement accessible ! Action requise sous 24h.",
    message_en: "⚠️ Gardien SMS/Email Alert: Publicly accessible .env file detected! Action required within 24h.",
    is_read: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'alt-2',
    domain_id: 'dom-sample-1',
    domain_url: 'ebanking-pme-africa.sn',
    severity: 'eleve',
    message_fr: "🔒 Alerte Certificat SSL : Expiration dans 4 jours. Renouvellement LWS recommandé.",
    message_en: "🔒 SSL Certificate Alert: Expiring in 4 days. LWS renewal recommended.",
    is_read: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  }
];
