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

export const MOCK_DEVELOPERS: Developer[] = [];
