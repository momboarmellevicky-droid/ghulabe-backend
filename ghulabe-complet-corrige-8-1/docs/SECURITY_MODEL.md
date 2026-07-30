# Modèle de sécurité

Dernière mise à jour : 30 juillet 2026.

## Principes
- Zero Trust
- Least Privilege
- Audit
- Chiffrement
- Contrôle des rôles

## Mesures concrètement en place (vérifiées dans le code)

### Réseau & en-têtes HTTP (server/server.ts)
- HSTS (`Strict-Transport-Security`, 1 an, sous-domaines inclus)
- CSP (`Content-Security-Policy`) restreignant les origines de scripts
- Anti-clickjacking (`X-Frame-Options: DENY`)
- Anti-MIME-sniffing (`X-Content-Type-Options: nosniff`)
- `Referrer-Policy: strict-origin-when-cross-origin`
- CORS restreint à une liste blanche d'origines (`CORS_ALLOWED_ORIGINS`), pas de wildcard

### Authentification & comptes (server/controllers/authController.ts)
- Mots de passe hachés avec bcrypt (12 rounds)
- 2FA par code OTP envoyé par email à chaque connexion
- Verrouillage temporaire du compte après plusieurs échecs de connexion
- Tokens JWT avec expiration stricte de 24h
- Validation du format email sur inscription, connexion et réinitialisation de mot de passe
- Mot de passe minimum 8 caractères à l'inscription

### Limitation de débit (server/middleware/rateLimiter.ts)
- 100 requêtes/minute par IP sur toutes les routes API
- 10 scans externes/heure par IP sur les routes de scan
- ⚠️ LIMITE CONNUE : compteurs actuellement en mémoire (pas de stockage persistant partagé). Ils repartent à zéro à chaque redémarrage/redéploiement du serveur. À corriger : migrer vers un stockage persistant (ex. table Supabase ou Redis) pour un comptage fiable dans la durée.

### Base de données
- Toutes les requêtes passent par le client Supabase (requêtes paramétrées), pas de SQL brut concaténé — protège nativement contre l'injection SQL classique

### Paiements
- Aucune donnée de carte bancaire n'est saisie, transmise ou stockée par GHULABE. Les paiements passent exclusivement par Mobile Money (Airtel/Moov) : l'autorisation se fait sur l'infrastructure de l'opérateur téléphonique, pas sur les serveurs GHULABE.

### Vérification anti-triche recrutement développeurs
- Documents d'identité et photos de vérification stockés dans un bucket Supabase Storage **privé** (pas d'accès public direct), consultation uniquement via URL signée à durée limitée (1h) et réservée aux comptes admin authentifiés.

### Frontend
- React échappe automatiquement le contenu affiché (protection XSS par défaut) ; aucun usage de `dangerouslySetInnerHTML` détecté dans le code.

## Limites connues à corriger (liste vivante, pas de fausse promesse de sécurité totale)
- Rate limiting non persistant entre redéploiements (voir ci-dessus)
- Pas de vérification d'identité automatisée par un tiers spécialisé (type Smile Identity) sur le recrutement développeurs — la validation finale des documents/photos est actuellement manuelle par l'équipe GHULABE
