# APBB – Plateforme de gestion des interventions

Cette base de code propose une architecture complète (API Node/Express + Frontend React 19) pour digitaliser le workflow décrit :
création des affaires, dispatch urgent/standard, suivi des interventions, astreintes, demandes de devis et validation des nouvelles installations.

## Structure du dépôt

```
.
├── backend   # API REST Node.js / Express / Prisma
└── frontend  # Application React 19 + Tailwind + shadcn + Framer Motion
```

## Backend

- **Langage** : TypeScript (Express, Prisma ORM, Zod)
- **Base de données** : SQLite (modifiable via `DATABASE_URL`)
- **Fonctionnalités couvertes** :
  - Gestion des clients et des sites
  - Affaires (dossiers) avec interventions multiples
  - Flux urgent/standard, assignation technicien, changements de statuts
  - Gestion des demandes de devis et des devis envoyés
  - Proposition/validation des nouvelles installations (appareils)
  - Files de validation (CR, devis, astreinte, installations)

### Scripts

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

> ℹ️ L’installation des dépendances peut nécessiter un accès internet au registre npm.

## Frontend

- **Framework** : React 19 beta + Vite + TypeScript
- **UI** : Tailwind CSS, shadcn/ui, Framer Motion, React Query
- **Vues** :
  - Dashboard synthétique
  - Affaires & interventions associées
  - Vue technicien mobile (Android)
  - Files bureau (CR, devis, installations, astreinte)

### Scripts

```bash
cd frontend
npm install
npm run dev
```

## Configuration

- Copier `.env.example` vers `.env` pour chaque package
- Lancer `npm run dev` dans `backend` puis `frontend`

## Prochaines étapes suggérées

- Ajouter authentification/gestion des rôles
- Implémenter la synchronisation calendrier & email
- Connecter le stockage des médias (Drive, S3…)
- Couvrir par des tests automatisés (API + UI)
