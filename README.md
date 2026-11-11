# OrdiSpace — Espace Livreur

Application web mobile (Next.js) des livreurs OrdiSpace : ils acceptent et réalisent les missions de livraison, encaissent le client et revendent des produits via leur boutique d'affiliation.

Elle consomme l'API du dépôt [`Ordi-Space_backend`](https://github.com/Daymond2025/Ordi-Space_backend) (Laravel) via des jetons Bearer (Sanctum).

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Authentification : téléphone + code OTP reçu par WhatsApp (inscription avec pièces justificatives) ; connexion e-mail + mot de passe conservée pour les anciens comptes (rôle `livreur`)
- Application installable (PWA, service worker, notifications push)

## Fonctionnalités principales

- **Missions** — liste, acceptation, itinéraire, suivi de livraison, preuve de livraison.
- **Encaissement** — mode de paiement du client (Mobile Money via QR Wave, espèces), paiements à reverser.
- **Boutique** — catalogue des produits ouverts à la revente, filtres, fiche produit, lien de vente affilié (copier / partager), commande pour un client, centre des ventes, portefeuille et retraits.
- **Compte** — disponibilité, véhicule, informations, notifications.

## Structure du projet

```text
src/
├── app/
│   ├── connexion/ (email/, verification/), inscription/, mot-de-passe-oublie/
│   ├── (shell)/               # Pages avec la barre de navigation : missions, itineraire/, paiements/, preuves/, compte/
│   ├── mission/[id]/          # Déroulé d'une mission (suivi, mode de paiement, espèces…)
│   ├── boutique/              # (tabs)/, categorie/, resultats/, produits/[id], ventes/, portefeuille/, profil/
│   ├── mes-infos/, modifier-profil/, notifications/
├── components/                # auth/, boutique/, compte/, mission/, space/
├── context/                   # AuthContext
└── lib/                       # api.ts, types.ts, filtresCatalogue.ts, portefeuille.ts, ventesBoutique.ts, push.ts…
```

## Démarrage

Prérequis : Node.js 20+, et l'API backend lancée.

```bash
npm install
cp .env.example .env.local   # renseigner les variables ci-dessous
npm run dev                  # http://localhost:3000
```

Pour lancer plusieurs applications OrdiSpace en même temps, choisir un autre port (`npm run dev -- -p 3001`) et l'ajouter à `CORS_ALLOWED_ORIGINS` dans le `.env` du backend. En local, sans WhatsApp configuré, le code OTP est renvoyé par l'API (`code_debug`).

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de base de l'API (ex. `http://127.0.0.1:8000/api/v1` en local, `https://ordisapce.daymondboutique.com/api/v1` en production) |
| `NEXT_PUBLIC_NUMERO_WAVE`, `NEXT_PUBLIC_NUMERO_ORANGE`, `NEXT_PUBLIC_NUMERO_MTN`, `NEXT_PUBLIC_NUMERO_MOOV` | Numéros marchands affichés au client si le scan du QR échoue (données d'affichage, pas de secret) |

Aucune clé secrète ne doit se trouver dans cette app.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Déploiement

Configurer les variables ci-dessus sur l'hébergeur et ajouter le domaine de l'app à `CORS_ALLOWED_ORIGINS` côté backend. Le backend utilise `LIVREUR_APP_URL` pour construire les liens de vente : il doit pointer vers le domaine de cette app.
