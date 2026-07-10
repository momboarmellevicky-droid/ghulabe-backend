import React from 'react';
import { Language } from '../../types';
import { ShieldCheck, FileCheck, Lock, AlertOctagon, Server } from 'lucide-react';

interface LegalModalProps {
  lang: Language;
  page: 'mentions' | 'privacy' | 'cgu' | 'disclaimer' | 'cookies' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ page, onClose }) => {
  if (!page) return null;

  const getPageContent = () => {
    switch (page) {
      case 'mentions':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#0066FF] border-b border-white/10 pb-4">
              <FileCheck className="w-6 h-6" />
              <h2 className="text-2xl font-display font-extrabold text-white">Mentions Légales — GHULABE</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#0066FF]/30 font-mono text-xs space-y-2">
                <p><strong>Éditeur et Créatrice :</strong> Mombo Armelle Vicky</p>
                <p><strong>Application :</strong> GHULABE</p>
                <p><strong>Année de création :</strong> 2026</p>
                <p><strong>Protection intellectuelle :</strong> © 2026 Mombo Armelle Vicky</p>
                <p className="text-[#00FF88]"><strong>Protection OAPI :</strong> Dépôt OAPI en cours — Toute reproduction interdite</p>
                <p><strong>Hébergeur :</strong> Render (Europe — région Frankfurt, Allemagne)</p>
              </div>

              <p>
                La plateforme GHULABE (ghulabe.com) est la première plateforme bilingue de diagnostic cybersécurité externe dédiée aux Petites et Moyennes Entreprises (PME) africaines. 
              </p>
              <p>
                Toute représentation, reproduction, modification ou exploitation intégrale ou partielle de la structure, du code source, du logo "Œil 3D" ou des rapports d'audit GHULABE sans l'autorisation expresse et écrite de Mombo Armelle Vicky est strictement illégale et passible de poursuites devant les juridictions compétentes de Libreville (Gabon) et l'Organisation Africaine de la Propriété Intellectuelle (OAPI).
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#00FF88] border-b border-white/10 pb-4">
              <Lock className="w-6 h-6" />
              <h2 className="text-2xl font-display font-extrabold text-white">Politique de Confidentialité</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-[#00FF88]/40 font-mono text-xs space-y-2 text-[#00FF88]">
                <p>🛡️ Conforme à la Loi n°001/2011 du Gabon portant protection des données personnelles et au RGPD européen.</p>
              </div>

              <h4 className="font-display font-bold text-white text-base">1. Données Collectées</h4>
              <p>
                GHULABE collecte strictement le minimum de données nécessaires au fonctionnement de la plateforme : email professionnel, nom ou raison sociale, pays d'établissement, et URL des domaines scannés.
              </p>

              <h4 className="font-display font-bold text-white text-base">2. Finalité du Traitement</h4>
              <p>
                Les données sont collectées à des fins de fourniture du service de scan externe de sécurité, de génération de rapports d'audit bilingues, et d'envoi d'alertes par SMS et Email pour l'offre Gardien.
              </p>

              <h4 className="font-display font-bold text-white text-base">3. Durée de Conservation & Hébergement</h4>
              <p>
                La durée maximale de conservation des données est de <strong>24 mois maximum</strong>. Toutes les données sont hébergées dans <strong>l'Union Européenne (Render, région Frankfurt) uniquement</strong> avec chiffrement AES-256 au repos et TLS 1.3 en transit.
              </p>

              <h4 className="font-display font-bold text-white text-base">4. Vos Droits & Contact</h4>
              <p>
                Conformément aux lois applicables, vous disposez d'un droit d'accès, de rectification et de suppression de vos données sur simple demande à : <code className="text-[#0066FF]">contact@ghulabe.com</code>. <strong>Aucune donnée n'est vendue ou partagée avec des tiers.</strong>
              </p>
            </div>
          </div>
        );

      case 'cgu':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#FFB800] border-b border-white/10 pb-4">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-2xl font-display font-extrabold text-white">Conditions Générales d'Utilisation (CGU)</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/40 font-mono text-xs text-[#FFB800]">
                ⚠️ GHULABE est un outil de diagnostic externe uniquement. Le scan sans accord préalable est illégal.
              </div>

              <h4 className="font-display font-bold text-white text-base">1. Certification de Propriété et Autorisation</h4>
              <p>
                En utilisant le scanner GHULABE, l'utilisateur certifie être le propriétaire ou l'administrateur autorisé du domaine scanné. Toute analyse effectuée sur un domaine ou système d'information n'appartenant pas au demandeur constitue une intrusion illégale réprimée par le Code Pénal Gabonais et les législations internationales.
              </p>

              <h4 className="font-display font-bold text-white text-base">2. Limitation de Responsabilité</h4>
              <p>
                GHULABE fournit un diagnostic externe indicatif basé sur des sondes de sécurité. GHULABE ne peut en aucun cas être tenu responsable des failles détectées non corrigées par l'utilisateur, ni des incidents ou pertes découlant de vulnérabilités masquées ou zero-day.
              </p>

              <h4 className="font-display font-bold text-white text-base">3. Résiliation & Droit Applicable</h4>
              <p>
                La résiliation d'un abonnement Gardien s'effectue moyennant un préavis de <strong>30 jours</strong>. Tout litige relatif à l'interprétation ou l'exécution des présentes relève de la compétence exclusive des <strong>Tribunaux de Libreville, Gabon</strong>. Le droit applicable est le <strong>Droit Gabonais et les Actes uniformes de l'OHADA</strong>.
              </p>
            </div>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#FF6B2D] border-b border-white/10 pb-4">
              <AlertOctagon className="w-6 h-6" />
              <h2 className="text-2xl font-display font-extrabold text-white">Clause de Non-Responsabilité Développeurs</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#FF6B2D]/10 border border-[#FF6B2D]/40 font-mono text-xs text-[#FF6B2D]">
                🤝 GHULABE assure uniquement la mise en relation entre PME et Développeurs Certifiés indépendants.
              </div>

              <p>
                Les développeurs certifiés et référencés sur le portail GHULABE (ghulabe.com/dev) sont des prestataires et consultants indépendants, non des employés, mandataires ou sous-traitants de GHULABE ou de Mombo Armelle Vicky.
              </p>
              <p>
                GHULABE assure exclusivement la mise en relation technique sur la base des certifications obtenues au test QCM. Par conséquent, tout contrat, prestation, facturation ou litige intervenant entre un client PME et un développeur indépendant certifié relève exclusivement de leur contrat bilatéral direct.
              </p>
              <p>
                GHULABE ne garantit pas l'exécution, la qualité, les délais ou les résultats des interventions de correction effectuées par les développeurs indépendants et décline toute responsabilité contractuelle ou délictuelle à cet égard.
              </p>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[#80C4FF] border-b border-white/10 pb-4">
              <Server className="w-6 h-6 text-[#0066FF]" />
              <h2 className="text-2xl font-display font-extrabold text-white">Politique de Cookies</h2>
            </div>

            <div className="space-y-4 text-sm text-gray-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10 font-mono text-xs">
                🍪 Zéro cookie publicitaire ou de tracking tiers.
              </div>

              <h4 className="font-display font-bold text-white text-base">1. Cookies Techniques Obligatoires</h4>
              <p>
                GHULABE utilise uniquement des cookies strictement techniques essentiels au fonctionnement, à la sécurité de la session d'authentification (JWT) et à la mémorisation de la langue (Français/Anglais).
              </p>

              <h4 className="font-display font-bold text-white text-base">2. Cookies Analytiques & Publicitaires</h4>
              <p>
                Les cookies de mesure d'audience anonymes sont désactivables à tout moment par l'utilisateur. <strong>Aucun cookie publicitaire ou de tracking tiers n'est déposé ou exploité sur GHULABE.</strong>
              </p>

              <h4 className="font-display font-bold text-white text-base">3. Durée de Conservation</h4>
              <p>
                La durée de conservation maximale des cookies déposés sur votre terminal est de <strong>12 mois maximum</strong>.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto py-10">
      <div className="glass-card max-w-3xl w-full p-8 sm:p-12 rounded-3xl border border-[#0066FF] shadow-[0_0_50px_rgba(0,102,255,0.3)] my-auto space-y-8 max-h-[85vh] flex flex-col justify-between overflow-hidden">
        <div className="overflow-y-auto pr-2 flex-1">
          {getPageContent()}
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs font-mono text-gray-400">
          <span>© 2026 GHULABE — Mombo Armelle Vicky</span>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] text-white hover:text-[#0A0A0F] font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Fermer le document
          </button>
        </div>
      </div>
    </div>
  );
};
