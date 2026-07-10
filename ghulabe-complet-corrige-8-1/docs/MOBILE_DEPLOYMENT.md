# Déploiement mobile

Workflow :
Téléphone -> GitHub -> Render -> Application en ligne

Composants :
- GitHub : hébergement du code source et déclenchement du build
- Render : build + exécution du backend Express (server/)
- Supabase (EU) : base de données PostgreSQL + authentification
- SingPay : paiements (Airtel Money / Moov Money)

Aucun serveur personnel permanent n'est requis.
Les secrets (.env) ne sont jamais commités sur GitHub — ils sont configurés
directement dans les variables d'environnement du dashboard Render.
