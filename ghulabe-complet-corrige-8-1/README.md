# Ghulabe Cybersecurity Platform

## Architecture Cloud Native Mobile-First

Ghulabe est conçu pour être développé, maintenu et déployé depuis un smartphone.

Architecture:
Frontend React -> Services Cloud -> Supabase -> Services IA/Paiement

Technologies:
- React + TypeScript
- Node/TypeScript (migration progressive vers fonctions cloud)
- Supabase (EU) — base de données + authentification
- Gemini AI — analyse des scans
- SingPay — paiements (Airtel Money / Moov Money)

Hébergement:
- Backend : Render (Europe / Frankfurt)
- Frontend : Render (Static Site)
- GitHub : source de vérité, déploiement automatique

Statut:
Phase 1 documentation et Phase 2 restructuration modules.
