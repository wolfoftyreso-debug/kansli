import type { MessageKey } from "./en.ts";

export const FR: Record<MessageKey, string> = {
  "chrome.rooms": "Salles",
  "chrome.services": "Services",
  "chrome.signIn": "Se connecter",
  "chrome.signOut": "Se déconnecter",
  "chrome.signedOut": "non connecté",
  "chrome.switchOrg": "Changer d’entreprise",
  "chrome.menu": "Menu",
  "chrome.language": "Langue",
  "chrome.orgs": "Entreprises",
  "chrome.skipToContent": "Aller au contenu",
  "chrome.roomsMobile": "Salles, mobile",

  "runtime.production": "production",
  "runtime.preview": "aperçu",
  "runtime.local": "local",

  "home.hello": "Bonjour",
  "home.helloNamed": "Bonjour, {name}",
  "home.roleAdmin": "Administrateur système",
  "home.roleOpen": "Surface ouverte",
  "home.programs": "Programmes · {count} installés",
  "home.openKansli": "Ouvrir Kansli",
  "home.documentation": "Documentation",
  "home.metaDescription": "Une salle par tâche. La même connexion.",

  "service.platform": "Plateforme",
  "service.ops": "Exploitation",
  "service.events": "Événements",
  "service.procurement": "Marchés",
  "service.intake": "Nouveau client",
  "service.docs": "Documentation",

  "category.kansli": "Accueil",
  "category.ekonomi": "Livre",
  "category.tora": "Marchés",
  "category.rita": "Impôt",
  "category.britt": "Suivi",
  "category.irma": "Accords",
  "category.tyra": "Hôtel de pneus",
  "category.alva": "Diagnostic",
  "category.creditae": "Crédit",

  "idp.title": "Se connecter · Pixdrift",
  "idp.heading": "Connexion",
  "idp.email": "E-mail",
  "idp.password": "Mot de passe",
  "idp.submit": "Se connecter",
  "idp.noAccount": "Pas de compte ?",
  "idp.requestAccess": "Demander l’accès par le marché de groupe",
  "idp.wrongCredentials": "E-mail ou mot de passe incorrect.",
  "idp.tooManyAttempts": "Trop de tentatives. Réessayez dans un moment.",
  "idp.errorTitle": "Erreur",
  "idp.errorHeading": "La demande ne peut pas être traitée",
  "idp.loginUnavailable": "La connexion n’est pas disponible pour le moment",
  "idp.loginUnavailableBody":
    "Nous n’avons pas pu joindre la connexion. Réessayez dans un moment ou revenez à {home}.",
  "idp.home": "l’accueil",
  "idp.pkceRequired": "PKCE (S256) est requis",
  "idp.demo": "Démo : {email} / {password}",

  "common.missing": "manquant",
  "common.all": "Tous",
  "common.loading": "Chargement…",
  "common.saving": "Enregistrement…",
  "common.configured": "configuré · {auth}",
  "common.missingKey": "clé manquante",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "La panne du client, notes et mesures. Le diagnostic vient plus tard.",
  "alva.lead":
    "ALVA prend ce que le client a dit, ce que vous avez noté et ce qui a été mesuré. Le diagnostic sera branché plus tard. Le système ne diagnostique pas tout seul.",
  "alva.notice":
    "Le diagnostic n’est pas encore branché. Vous pouvez remplir un protocole vide avec vos propres faits. Le système n’invente jamais rien.",
  "alva.signInTitle": "Connectez-vous pour enregistrer des dossiers",
  "alva.signInBody": "Le dossier est enregistré dans ALVA. Connectez-vous pour l’enregistrer.",
  "alva.newCase": "Nouveau dossier",
  "alva.complaint": "Description du client",
  "alva.vehicleRef": "Référence véhicule (facultatif)",
  "alva.area": "Zone (facultatif, p. ex. freins)",
  "alva.mileage": "Compteur km (facultatif)",
  "alva.desiredOutcome": "Résultat souhaité (facultatif)",
  "alva.register": "Enregistrer le dossier",
  "alva.cases": "Dossiers",
  "alva.empty": "Pas encore de dossiers.",
  "alva.status.open": "Ouvert",
  "alva.status.in_progress": "En cours",
  "alva.status.closed": "Fermé",
  "alva.detailMetaTitle": "Dossier — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Connectez-vous pour voir le dossier",
  "alva.detailSignInBody": "Le dossier appartient à l’organisation.",
  "alva.detailNotice":
    "Vous remplissez les faits vous-mêmes. Le système ne tire aucune conclusion.",
  "alva.vehicleRefShort": "Référence véhicule",
  "alva.areaShort": "Zone",
  "alva.mileageShort": "Compteur",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Évaluation de crédit d’une contrepartie. Votre conclusion, aucune note inventée.",
  "creditae.lead":
    "CREDITAE prend qui vous allez évaluer et ce à quoi vous êtes arrivés. Le système ne pose aucune note de crédit.",
  "creditae.noticeOn":
    "Crédit activé. Le rapport du bureau est récupéré à l’enregistrement. Votre conclusion reste la vôtre.",
  "creditae.noticeOff":
    "Crédit désactivé. Aucun bureau de crédit n’est branché. L’évaluation est la vôtre. Le système n’invente jamais de note.",
  "creditae.signInTitle": "Connectez-vous pour évaluer une contrepartie",
  "creditae.signInBody":
    "La demande est enregistrée dans CREDITAE. Connectez-vous pour l’enregistrer.",
  "creditae.newInquiry": "Nouvelle demande",
  "creditae.orgNumber": "Numéro d’organisation",
  "creditae.companyName": "Nom de l’entreprise (facultatif)",
  "creditae.reason": "Pourquoi vous évaluez (facultatif)",
  "creditae.register": "Enregistrer la demande",
  "creditae.inquiries": "Demandes",
  "creditae.empty": "Pas encore de demandes.",
  "creditae.status.open": "Ouverte",
  "creditae.status.assessed": "Évaluée",
  "creditae.assess.go": "Avancer",
  "creditae.assess.watch": "Surveiller",
  "creditae.assess.stop": "Arrêter",
  "creditae.vendor.blocked": "Crédit désactivé",
  "creditae.vendor.failed": "Pas de rapport",
  "creditae.vendor.fetched": "Rapport reçu",
  "creditae.detailMetaTitle": "Demande — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Connectez-vous pour voir la demande",
  "creditae.detailSignInBody": "La demande appartient à l’organisation.",
  "creditae.detailNoticeOn":
    "Vous remplissez la conclusion vous-mêmes. Les champs du bureau ne sont pas votre évaluation.",
  "creditae.detailNoticeOff":
    "Vous remplissez la conclusion vous-mêmes. Le système ne pose aucune note de crédit.",
  "creditae.why": "Pourquoi",
  "creditae.bureau": "Bureau de crédit",
  "creditae.vendorName": "Nom chez le bureau",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "La page d’accueil. Tâches et l’entrée.",
  "kansli.lead":
    "Tout commence ici. La même connexion dans chaque système, et un tableau de tâches pour le travail interne.",
  "kansli.signInTitle": "Se connecter avec Pixdrift",
  "kansli.signInBody": "La même connexion couvre TORA, RITA, BRITT, IRMA et ALVA.",
  "kansli.firstCustomer": "Premier client — une liste, pas une date",
  "kansli.groupProcurement": "Marché de groupe",
  "kansli.family": "La famille",
  "kansli.map": "La carte",
  "kansli.mapLead": "Ce que fait chaque système, et comment ils se relient.",
  "kansli.recentEvents": "Événements récents",
  "kansli.notice":
    "Quand une tâche est créée, BRITT reçoit quelque chose à suivre. Kansli reste propriétaire de la tâche.",

  "tasks.summary": "Tableau de tâches — {open} ouvertes, {done} faites.",
  "tasks.titlePlaceholder": "Nouvelle tâche…",
  "tasks.titleAria": "Titre de la tâche",
  "tasks.ownerPlaceholder": "Responsable",
  "tasks.ownerAria": "Responsable",
  "tasks.add": "Ajouter",
  "tasks.empty": "Pas encore de tâches. Ajoutez la première ci-dessus.",
  "tasks.remove": "Retirer",
  "tasks.markDone": "Marquer « {title} » comme faite",
  "tasks.removeNamed": "Retirer « {title} »",
  "tasks.fetchError": "Impossible de charger les tâches.",
  "tasks.saveError": "Impossible d’enregistrer la tâche.",
  "tasks.updateError": "Impossible de mettre à jour la tâche.",
  "tasks.deleteError": "Impossible de retirer la tâche.",
  "tasks.genericError": "Quelque chose s’est mal passé.",
  "tasks.emptyTitle": "Le titre ne peut pas être vide.",

  "platform.metaTitle": "Plateforme — Pixdrift",
  "platform.metaDescription": "Ce que fait chaque système, et comment ils se relient.",
  "platform.heading": "Ce que fait chaque système",
  "platform.notice":
    "Chaque système fait un travail. TORA prend les marchés. RITA prend l’impôt. Ils ne se mélangent pas.",
  "platform.systems": "Les systèmes",
  "platform.howTheyConnect": "Comment ils se relient",
  "platform.moreSystems": "Plus de systèmes",
  "platform.waiting": "En attente de branchement",
  "platform.tech": "Technique — pour celui qui tient l’exploitation",
  "platform.gateway": "Passerelle de modèles",
  "platform.gatewayLead":
    "Une clé donne accès à plus de 100 modèles. Souvenez-vous : les réponses du système sont des conjectures, pas des faits.",
  "platform.gatewayHint": "Définissez {key} dans Secrets ou {oidc} sur Vercel.",

  "family.status.operational": "En marche",
  "family.status.pilot": "En chemin",
  "family.status.deferred": "Pas encore prêt",
  "family.principle":
    "La même connexion dans chaque système. Chaque système fait le sien. TORA prend les marchés. RITA prend l’impôt. Ils ne se mélangent pas.",
  "family.incoming":
    "D’autres systèmes sont en chemin. Ils recevront la même connexion et leurs propres données. Les noms viennent quand ils sont prêts — pas avant.",
  "family.party.products": "tous les produits",
  "family.party.events": "la liste des événements",
  "family.identity.mission": "Une connexion pour chaque système.",
  "family.kansli.mission": "La page d’accueil. Tâches et l’entrée.",
  "family.ekonomi.mission": "Factures, TVA et comment l’argent est entré.",
  "family.tora.mission": "Quels marchés votre entreprise peut prendre.",
  "family.rita.mission": "Cherche des économies d’impôt dans vos livres.",
  "family.britt.mission": "Ce qui s’est passé et doit être suivi.",
  "family.irma.mission": "Envoyer un accord, voir s’il est lu et confirmé.",
  "family.tyra.mission": "Client, voiture, roues et la suite.",
  "family.alva.mission": "La panne du client, notes et mesures. Le diagnostic vient plus tard.",
  "family.creditae.mission":
    "Évaluation de crédit d’une contrepartie. Votre conclusion, aucune note inventée.",
  "family.identity.question": "Qui êtes-vous, et pour quelle entreprise cela vaut-il ?",
  "family.identity.does":
    "Vous vous connectez une fois. Ensuite vous êtes dans Kansli, TORA, RITA et les autres.",
  "family.identity.doesNot":
    "Aucune facture n’est envoyée ici, et il n’y a pas encore de code mobile supplémentaire.",
  "family.kansli.question": "Par où commencer, et que devons-nous faire en interne ?",
  "family.kansli.does":
    "Connexion, un tableau de tâches interne et le formulaire des nouveaux clients.",
  "family.kansli.doesNot":
    "Kansli ne calcule ni les marchés, ni l’impôt, ni les pneus. Les autres systèmes le font.",
  "family.ekonomi.question":
    "Qu’est-ce qui est comptabilisé, qu’est-ce qui est en retard, et comment l’argent est-il entré ?",
  "family.ekonomi.does":
    "Écrit une facture à 10 jours, comptabilise en öre, relie Stripe et Revolut, rapproche les encaissements lorsque la banque est connectée.",
  "family.ekonomi.doesNot":
    "Pas Visma. Pas Fortnox. Aucun encaissement inventé. Les cartes exigent Stripe. Swish exige que Swish soit branché.",
  "family.tora.question": "Pouvons-nous soumissionner ici — et que devons-nous faire maintenant ?",
  "family.tora.does":
    "Compare l’entreprise aux marchés : exigences, écarts, montants, dates et l’étape suivante.",
  "family.tora.doesNot": "Ne regarde pas les livres. C’est RITA.",
  "family.rita.question":
    "Quelles déductions, TVA et autres écarts se trouvent dans les comptes annuels ?",
  "family.rita.does":
    "Lit les comptes annuels face aux règles fiscales suédoises et laisse des propositions à vérifier. Pas un conseil fiscal.",
  "family.rita.doesNot":
    "N’invente pas de résultats. Ne dit pas si vous pouvez soumissionner. Pas encore de fichier client à téléverser.",
  "family.britt.question": "Que devez-vous faire maintenant, d’après ce qui s’est déjà passé ?",
  "family.britt.does":
    "Rassemble ce qui doit être suivi. Une chose à la fois, avec l’étape suivante.",
  "family.britt.doesNot": "BRITT n’est pas un système de dossiers et n’est pas un chat.",
  "family.irma.question": "La contrepartie a-t-elle lu et confirmé l’accord ?",
  "family.irma.does": "Envoie l’accord. Montre s’il est ouvert, signé ou refusé.",
  "family.irma.doesNot":
    "IRMA n’est pas un courriel et n’est pas une archive de tous les documents.",
  "family.tyra.question":
    "Quel client, quelle voiture, quelles roues — et quelle est l’étape suivante ?",
  "family.tyra.does":
    "Tient ensemble client, véhicule et pneus. Montre quand il est temps de changer ou de récupérer.",
  "family.tyra.doesNot": "TYRA n’est pas un registre clients général pour d’autres métiers.",
  "family.alva.question": "Qu’a dit le client, qu’a-t-on mesuré — et quelle est l’étape suivante ?",
  "family.alva.does":
    "Prend ce qui a été dit et mesuré. Montre la note. Ne diagnostique pas tout seul.",
  "family.alva.doesNot": "ALVA ne diagnostique pas et ne donne pas de conseil.",
  "family.creditae.question": "Qui devons-nous évaluer — et à quoi êtes-vous arrivés ?",
  "family.creditae.does":
    "Prend un numéro d’organisation et votre évaluation. Récupère le rapport du bureau via le canal crédit de la plateforme lorsqu’il est branché. Avancer, surveiller ou arrêter.",
  "family.creditae.doesNot":
    "CREDITAE ne pose aucune note de crédit. Le produit n’appelle pas Creditsafe.",
  "family.stack.language": "Langue",
  "family.stack.language.runs":
    "TypeScript 5 dans tout le système. SQL dans la base. L’analyse de RITA tourne comme un programme à part. ekonomi-ledger contrôle les pièces, ne comptabilise pas en production.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Un processus : site, /idp, produits et API.",
  "family.stack.identity": "Identité",
  "family.stack.identity.runs":
    "Connexion propre, sur une norme ouverte. Un cookie vous garde connecté. La même connexion dans chaque système.",
  "family.stack.data": "Données",
  "family.stack.data.runs":
    "PostgreSQL 16. Chaque système a ses propres données. Aucun système n’écrit dans celles d’un autre.",
  "family.stack.analysis": "Analyse",
  "family.stack.analysis.runs":
    "TORA calcule dans le même processus. RITA appelle sa propre analyse. Aucun résultat inventé en production.",
  "family.stack.automation": "Automatisation",
  "family.stack.automation.runs":
    "Les modèles passent par la passerelle Vercel. La réponse est une hypothèse, pas un fait.",
  "family.stack.ops": "Exploitation et test",
  "family.stack.ops.runs":
    "Tourne sur Vercel. Tests contre Postgres 16. Pas de AWS SDK dans ce système.",
  "family.link.identity.products":
    "Une connexion. Les produits ne lisent pas les listes d’utilisateurs des autres.",
  "family.link.identity.events":
    "Une connexion réussie est écrite dans le journal. C’est un reçu, pas une tâche à suivre.",
  "family.link.tora.britt":
    "Seulement quand quelqu’un publie. Lire le marché ne crée aucun événement.",
  "family.link.rita.britt":
    "BRITT reçoit le nom de l’entreprise, le nombre de résultats et si l’automatisation était impliquée. Pas les propositions elles-mêmes — elles restent dans RITA.",
  "family.link.irma.britt": "Accord créé, ouvert, confirmé ou retiré.",
  "family.link.tyra.britt":
    "Un dossier, un lien client ou un rappel en file. Une file bloquée ne veut pas dire envoyé.",
  "family.link.alva.britt":
    "Un dossier est enregistré. Aucun diagnostic ne suit tant qu’il n’est pas branché.",
  "family.link.creditae.britt":
    "Une contrepartie est enregistrée, vous avez écrit votre conclusion, ou le rapport du bureau est arrivé ou s’est arrêté. Aucune note inventée ne suit.",
  "family.link.ekonomi.britt":
    "Une facture émise, un encaissement comptabilisé ou une récupération Revolut qui n’est pas passée.",
  "family.link.ekonomi.revolut":
    "Le cycle de vie de la connexion bancaire. Un renouvellement ordinaire est journalisé comme exploitation, pas comme quelque chose à suivre.",
  "family.link.ekonomi.invoice":
    "Un brouillon apparaît dans le journal. Pas de comptabilité avant émission.",
  "family.link.kansli.task":
    "Une tâche interne apparaît chez BRITT. Kansli reste propriétaire de la tâche.",
  "family.link.kansli.intake":
    "Une demande est arrivée, ou un compte atelier a été créé pour la démo.",
  "family.link.britt.finding":
    "Les résultats les plus importants de l’analyse d’exemple deviennent des choses à suivre. Le reste reste dans BRITT.",
  "family.link.britt.events":
    "Chaque chose à suivre est aussi écrite dans la liste des événements.",
  "family.blocked.rita":
    "L’analyse de RITA doit être branchée (sur Vercel via URL, en local via le fichier du programme) avant que les analyses puissent tourner.",
  "family.blocked.alva":
    "Le diagnostic guidé est branché lorsqu’il est prêt. Le dossier peut déjà être enregistré.",
  "family.blocked.irma":
    "IRMA reste chez nous : une confirmation numérique simple et son propre lien. Pas encore de signature électronique juridique.",
  "family.blocked.britt":
    "Fortnox, Revolut et les profils de BRITT si l’analyse d’exemple doit devenir tout le produit.",
  "family.blocked.ekonomi":
    "Stripe, Revolut et Swish lorsque vous voulez encaisser ainsi. Une facture à 10 jours fonctionne sans eux.",
  "family.blocked.creditae":
    "CREDITAE passe par le canal crédit de la plateforme. Les produits n’appellent pas Creditsafe. Sans clé aucun rapport n’est récupéré. L’évaluation reste la vôtre.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Client, voiture, roues et la suite.",
  "tyra.heading": "Quel véhicule entre ?",
  "tyra.lead":
    "TYRA tient ensemble client, voiture et roues. Les pneus se vendent ici — un clic comptabilise la facture dans Ekonomi. Les montants sont vos propres chiffres. Pas encore de prix en direct.",
  "tyra.customers": "Fiches clients",
  "tyra.integrations": "Intégrations",
  "tyra.signInTitle": "Connectez-vous pour ouvrir des dossiers",
  "tyra.signInBody":
    "La même connexion que le reste de Pixdrift. Pas de compte extra pour l’atelier.",
  "tyra.notice":
    "Les rappels vont en file mais ne sont pas encore envoyés — il manque une connexion SMS et courriel. Pas de prix pneus en direct.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Factures, TVA et comment l’argent est entré.",
  "ekonomi.heading": "Qu’est-ce qui est comptabilisé ?",
  "ekonomi.lead":
    "Comptabilisez les ventes en couronnes. Un clic émet la facture. Les devis TYRA non comptabilisés restent en file. Le client peut payer avec Swish, Stripe ou une facture à 10 jours. Reliez Revolut une fois, les relevés sont récupérés et les paiements rapprochés. Visma est la prochaine connexion — elle n’est pas encore ici.",
  "ekonomi.signInTitle": "Connectez-vous pour voir le livre",
  "ekonomi.signInBody":
    "Les livres appartiennent à votre entreprise. Connectez-vous pour les voir.",
  "ekonomi.notice":
    "Vous écrivez des couronnes. Le livre stocke des öre. Chaque pièce s’équilibre. Les paiements ne tournent pour de vrai que lorsque les connexions sont en place — rien n’est simulé sans votre accord.",
  "ekonomi.statements": "Relevés",
  "ekonomi.invoices": "Factures",
  "ekonomi.vouchers": "Pièces",
  "ekonomi.reports": "Rapports / TVA",
  "ekonomi.connections": "Connexions",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Quels marchés votre entreprise peut prendre.",
  "tora.lead":
    "TORA montre quels marchés {name} peut soumissionner — et pourquoi vous. Voici toute l’évaluation : exigences, écarts et l’étape suivante.",
  "tora.noticeDemo":
    "Les marchés sont des exemples, pas de vrais avis. L’affichage est un compte payant, vous voyez donc noms, montants et exigences. Les faits entreprise sont l’entreprise d’exemple jusqu’à ce que vous enregistriez votre propre profil.",
  "tora.noticeSaved":
    "Les marchés sont des exemples, pas de vrais avis. L’affichage est un compte payant, vous voyez donc noms, montants et exigences. Les faits entreprise sont votre profil enregistré ({name}).",
  "tora.calendar": "Calendrier",
  "tora.current": "En cours",
  "tora.upcoming": "À venir",
  "tora.watch": "Surveillance",
  "tora.publishedValue": "Valeur publiée",
  "tora.yourCompany": "Votre entreprise",
  "tora.profileLead":
    "Sans profil enregistré nous calculons sur l’entreprise d’exemple au lieu de vous.",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA cherche des économies fiscales dans vos livres.",
  "rita.lead":
    "RITA cherche des économies fiscales dans vos livres : déductions, TVA, K10, pension et R&D. Ce que RITA trouve sont des propositions à vérifier — pas un conseil fiscal.",
  "rita.noticeReady":
    "L’analyse tourne. Une partie de la réponse vient d’un modèle et peut demander un second regard.",
  "rita.noticeRules":
    "L’analyse tourne, mais sans modèle pour l’instant. Seules les règles fixes sont utilisées.",
  "rita.noticeBlocked":
    "L’analyse n’est pas encore branchée, les nouvelles analyses restent donc bloquées. Nous ne montrons jamais de résultats inventés.",
  "rita.noticeExample":
    "Les comptes d’exemple sont un exemple intégré — pas quelque chose qu’un client a téléversé.",
  "rita.signInTitle": "Connectez-vous pour demander une analyse",
  "rita.signInBody":
    "L’analyse est stockée dans RITA. BRITT reçoit quelque chose à suivre lorsqu’une analyse se termine ou s’arrête.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Ce qui s’est passé et doit être suivi.",
  "britt.lead":
    "BRITT rassemble ce qui doit être suivi. Les chiffres ici sont des exemples — pas encore de connexions Fortnox ou Revolut.",
  "britt.noticeDemo":
    "Les chiffres ici sont des exemples pour la maison, pas Fortnox et pas une caisse en direct.",
  "britt.noticeOwn":
    "Ici vous suivez vos propres observations. Les chiffres d’exemple ne tournent que sur la maison.",
  "britt.signInTitle": "Connectez-vous pour voir les observations",
  "britt.signInBody":
    "Les observations appartiennent à votre entreprise. Ce qui se passe dans TORA, RITA et IRMA apparaît ici.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Envoyer un accord, voir s’il est lu et confirmé.",
  "irma.heading": "Quel accord doit sortir ?",
  "irma.lead":
    "Avec IRMA vous envoyez des accords en numérique : créer, envoyer un lien, voir quand la contrepartie a ouvert et confirmé. La contrepartie n’a pas besoin de compte. C’est une confirmation numérique simple, pas une signature électronique juridique. Il n’y a pas encore d’archive de documents.",
  "irma.signInTitle": "Connectez-vous pour créer des accords",
  "irma.signInBody":
    "Le lien s’affiche une fois — copiez-le tout de suite. Nous ne le stockons pas sous forme lisible.",
  "creditae.vendorScore": "Valeur du bureau",
  "creditae.vendorLimit": "Limite du bureau",
  "creditae.vendorNotConclusion": "Ce sont les champs du bureau, pas votre conclusion.",
  "creditae.vendorWhyMissing": "Pourquoi le rapport manque",
  "creditae.notes": "Note",
  "creditae.yourAssessment": "Votre évaluation",
  "creditae.conclusion": "Conclusion",
};
