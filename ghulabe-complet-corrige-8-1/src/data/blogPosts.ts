export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string; // ISO date
  readingTimeMinutes: number;
  keyword: string;
  contentHtml: string; // simple HTML string, rendered with dangerouslySetInnerHTML
}

// Pour ajouter un nouvel article : dupliquer un objet ci-dessous, changer le slug,
// le titre, la description, et le contenu. Le slug devient l'URL : /blog/<slug>
export const blogPosts: BlogPost[] = [
  {
    slug: 'signes-site-web-vulnerable-piratage',
    title: '5 signes que votre site web est vulnérable au piratage',
    metaDescription:
      "Découvrez les 5 signes qui indiquent qu'un site web est vulnérable au piratage, et comment un scan de sécurité gratuit peut protéger votre PME.",
    excerpt:
      "La plupart des PME africaines découvrent que leur site est vulnérable seulement après une attaque. Voici les signaux à surveiller avant qu'il ne soit trop tard.",
    publishedAt: '2026-08-08',
    readingTimeMinutes: 4,
    keyword: 'site web vulnérable piratage',
    contentHtml: `
      <p>Un <strong>site web vulnérable au piratage</strong> ne donne pas toujours des signes évidents. Beaucoup de PME africaines découvrent la faille seulement après une attaque, quand les clients ne peuvent plus payer, que le site affiche des publicités inconnues, ou que Google bloque l'accès avec un avertissement rouge. Voici cinq signaux à surveiller avant d'en arriver là.</p>

      <h2>1. Votre certificat SSL est expiré ou absent</h2>
      <p>Si votre site s'affiche encore en HTTP (sans cadenas dans la barre d'adresse), ou si le navigateur affiche "Connexion non sécurisée", vos données et celles de vos clients circulent en clair. C'est l'une des failles les plus simples à exploiter, et l'une des plus faciles à corriger.</p>

      <h2>2. Aucune mise à jour depuis plusieurs mois</h2>
      <p>Un site construit sur WordPress, PrestaShop ou un CMS similaire qui n'a pas été mis à jour depuis longtemps accumule des failles connues et documentées publiquement. Les pirates automatisent leurs attaques justement sur ces failles déjà répertoriées.</p>

      <h2>3. Des fichiers sensibles sont accessibles publiquement</h2>
      <p>Des fichiers comme <code>.env</code>, <code>.git</code> ou des sauvegardes de base de données parfois laissés accessibles publiquement par erreur peuvent exposer mots de passe et clés d'API à quiconque connaît l'URL exacte.</p>

      <h2>4. Aucun en-tête de sécurité HTTP configuré</h2>
      <p>Des en-têtes comme HSTS, CSP ou X-Frame-Options empêchent des attaques courantes (détournement de clics, injection de scripts). Leur absence est un signe que la sécurité du site n'a jamais été auditée.</p>

      <h2>5. Vous ne savez pas répondre à la question "quand a-t-il été scanné pour la dernière fois ?"</h2>
      <p>Si la réponse est "jamais" ou "je ne sais pas", c'est le signal le plus clair de tous. La sécurité d'un site n'est pas un état permanent : de nouvelles failles apparaissent chaque semaine.</p>

      <h2>Comment vérifier gratuitement</h2>
      <p>Ghulabe propose un scan de sécurité gratuit qui vérifie ces cinq points en quelques minutes, sans installation, directement depuis l'URL de votre site. Vous recevez un rapport clair indiquant les failles trouvées et comment les corriger.</p>
    `,
  },
  {
    slug: 'cybersecurite-pme-afrique-guide-2026',
    title: 'Cybersécurité PME Afrique : le guide complet 2026',
    metaDescription:
      "Guide complet de la cybersécurité pour les PME africaines en 2026 : risques réels, coûts d'un piratage, et solutions accessibles pour se protéger.",
    excerpt:
      "La cybersécurité n'est plus réservée aux grandes entreprises. Voici ce que chaque PME africaine doit savoir pour se protéger en 2026, sans budget informatique dédié.",
    publishedAt: '2026-08-08',
    readingTimeMinutes: 6,
    keyword: 'cybersécurité PME Afrique',
    contentHtml: `
      <p>La <strong>cybersécurité pour les PME en Afrique</strong> a longtemps été perçue comme un sujet réservé aux grandes entreprises disposant d'un service informatique dédié. Cette perception change rapidement : les PME sont devenues une cible privilégiée, justement parce qu'elles sont moins protégées.</p>

      <h2>Pourquoi les PME africaines sont particulièrement exposées</h2>
      <p>Trois facteurs se combinent : la digitalisation rapide des commerces (sites e-commerce, paiement Mobile Money en ligne), le manque de budget dédié à la sécurité informatique, et une dépendance croissante aux outils numériques pour la relation client.</p>

      <h2>Ce que coûte réellement un piratage</h2>
      <p>Au-delà de la perte de données, un piratage entraîne concrètement : l'indisponibilité du site pendant la remise en état, la perte de confiance des clients, et parfois des frais juridiques si des données personnelles ont fuité. Pour une PME sans trésorerie de réserve, ces coûts cumulés peuvent menacer la survie de l'activité.</p>

      <h2>Les erreurs les plus courantes</h2>
      <ul style="margin-left: 1.2rem; list-style: disc;">
        <li>Utiliser le même mot de passe administrateur depuis la création du site</li>
        <li>Ne jamais mettre à jour le CMS ou les plugins installés</li>
        <li>Ne pas savoir qui, dans l'entreprise, a accès aux identifiants d'administration</li>
        <li>Ignorer les alertes de sécurité par manque de compétence technique en interne</li>
      </ul>

      <h2>Se protéger sans budget informatique dédié</h2>
      <p>La bonne nouvelle : sécuriser un site web n'exige plus forcément une équipe technique en interne. Un scan de sécurité régulier permet d'identifier les failles avant qu'elles ne soient exploitées, et de faire appel ponctuellement à un développeur certifié pour les corriger, sans embaucher à temps plein.</p>

      <h2>Par où commencer</h2>
      <p>La première étape est simple : savoir où en est réellement votre site aujourd'hui. Ghulabe permet de lancer un scan de sécurité gratuit en quelques minutes et d'obtenir un état des lieux clair, pensé pour être compris même sans connaissances techniques.</p>
    `,
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((post) => post.slug === slug);
