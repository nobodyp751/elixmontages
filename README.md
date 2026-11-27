# Elixmontages

"Crée une web app nommée Elix de marketplace pour connecter des monteurs vidéo TikTok et des créateurs. Les monteurs ont un profil avec leur vidéo portfolio, les créateurs peuvent commander un pack ou une vidéo à l'unité. Utilise Tailwind CSS et prévois l'intégration Supabase et Stripe Connect. L’application est une **place de marché en ligne** (comme un "Malt" ou "Fiverr", mais 100 % spécialisé pour TikTok, Reels et Shorts) qui simplifie la souscription et la livraison de montages vidéo.

Voici ce qu'elle fait très précisément pour chaque utilisateur :

---

### 1. Pour le Tiktokeur / Créateur de contenu (L'Acheteur)

* **Recherche ciblée :** Il parcourt un catalogue de monteurs filtrés par style (Gaming, Business, Humoristique, Vlog) avec un lecteur vidéo directement adapté au format vertical (9:16).

* **Commande en 2 clics :** Il choisit une vidéo à l'unité ou un pack mensuel (ex. 10 vidéos/mois), dépose le lien de ses rushs vidéo bruts (Google Drive, Dropbox) et paie directement en ligne.

* **Sécurité & Validation :** Son argent est **bloqué en séquestre** (il ne part pas immédiatement chez le monteur). Il ne valide le paiement final que lorsqu'il a reçu la vidéo montée et qu'il est satisfait.

---

### 2. Pour le Monteur Vidéo (Le Vendeur)

* **Vitrine professionnelle :** Il crée sa fiche avec son *Showreel* (sa démo), ses tarifs et ses disponibilités sans devoir démarcher sur les réseaux.

* **Garantie d'être payé :** Il commence à monter en sachant que le créateur a déjà déposé l'argent sur la plateforme.

* **Gestion simple :** Il livre les fichiers finaux via son espace client et reçoit son argent directement sur son compte bancaire dès que la commande est validée.

---

### 3. Pour Vous (Le Fondateur / La Plateforme)

* **Intermédiaire automatisé :** L'application met en relation les deux parties, héberge les échanges/retouches dans une messagerie interne et gère la livraison.

* **Prélèvement de commission :** À chaque commande (ex: 100 €), l'application découpe automatiquement la somme via le système de paiement : **85 € vont au monteur et 15 € arrivent directement dans votre poche** au titre de frais de service.ajoute le porte folio des monteurs avec 3 videos max les catégorisations des videos (+ de 1 min , etc) une bio et oui met toutes les fonctionnalités que tu m a proposéLes 8 fonctionnalités clés couvrent tout le flux de bout en bout : catalogue → commande → séquestre → livraison → validation → commission. Le plan est déjà prêt à générer si vous voulez un premier aperçu — le bouton Generate est juste au-dessus de cette conversation.

Quelques pistes pour affiner avant (ou après) la génération :

• Système de notation — les créateurs peuvent noter le monteur après validation, ce qui alimente les fiches vitrines

• Tableau de bord fondateur — vue admin pour suivre les commandes, les commissions perçues et les litiges

• Gestion des retouches — un compteur de retouches incluses par offre (ex. 2 retouches gratuites, puis payant)• Portfolio monteur — jusqu'à 3 vidéos de référence, chacune catégorisée par durée (moins de 30s, 30–60s, 1–3 min, plus de 3 min) et par style, avec une bio personnalisée

• Système de notation — note 1 à 5 étoiles + commentaire après chaque validation, moyenne affichée sur la vitrine

• Tableau de bord fondateur — vue privée pour suivre les commandes, les commissions et gérer les litiges

• Gestion des retouches — compteur de retouches incluses par offre, les retouches supplémentaires sont facturées

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5e6b020-c402-583c-8e28-ed590ca1bed5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
