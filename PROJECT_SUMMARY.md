# CityGuide BFF - Node.js Bootcamp Summary

Ce document récapitule la construction d'un Backend For Frontend (BFF) pour application mobile, réalisé dans le cadre d'un "Bootcamp accéléré" pour une transition vers un poste de Développeur Node.js Confirmé.

## 🏗️ Stack Technique

- **Runtime** : Node.js
- **Framework** : Express.js (Minimaliste, standard de l'industrie)
- **Langage** : TypeScript (Typage strict, indispensable en prod)
- **Validation** : Zod
- **Sécurité** : Helmet, Cors, Auth Middleware custom
- **Logging** : Morgan

---

## 📅 Progression du Projet

### Jour 1 : Architecture & Fondations

Mise en place d'une "Clean Architecture" pour éviter le code spaghetti.

- **Séparation des responsabilités** :
  - `src/server.ts` : Point d'entrée, gestion du réseau et arrêt propre (Graceful Shutdown).
  - `src/app.ts` : Déclaration de l'application Express, des middlewares et des routes. Séparé pour faciliter les tests.
  - `src/config/env.ts` : Chargement sécurisé des variables d'environnement (`.env`) avec validation Zod (Fail Fast philosophy).
- **Gestion d'erreurs (Best Practice)** :
  - Création d'une classe `AppError` étendant `Error` pour standardiser les codes HTTP + Messages.
  - Mise en place d'un middleware global `errorHandler` pour intercepter toutes les erreurs (synchrones et asynchrones) et renvoyer un JSON uniforme.

### Jour 2 : Logique Métier (BFF Pattern)

Implémentation de l'agrégation de données pour servir le mobile.

- **Services** : Création de 3 services (`weather`, `events`, `traffic`) simulant des appels API externes avec latence.
- **Concurrence & Event Loop** : Utilisation de `Promise.all` dans le contrôleur.
  - _Concept Clé_ : Node.js est Single Threaded. On ne bloque pas le thread principal. On lance les 3 appels API en parallèle et on attend qu'ils soient tous finis. Gain de temps ~50% vs séquentiel.
- **Transformation** : Le contrôleur formate les données brutes pour ne renvoyer que l'essentiel à l'app mobile (Data minimization).

### Jour 3 : Robustesse, Sécurité & Middlewares

Transformation du code "qui marche" en code "sécurisé et maintenable".

- **Validation (Zod Middleware)** :
  - Création d'un middleware générique `validate(schema)`.
  - Plus de `if (!req.query.city)` dans les contrôleurs. La validation est déclarative et réutilisable.
  - Gestion fine des types Zod (`ZodType`, `safeParse`) pour éviter les crashs.
- **Authentification (Middleware Custom)** :
  - Implémentation de `requireAuth` qui vérifie le Header `Authorization: Bearer <token>`.
  - Protection des routes sensibles.
- **Observabilité** : Ajout de `morgan` pour logger chaque requête HTTP (Status code, latency).

### Jour 4 : Performance & Scalabilité (Expert Level)

Optimisation pour la production et le fort trafic.

- **Rate Limiting** :
    - Protection de l'API contre les abus (DDoS, Bruteforce) avec `express-rate-limit`.
    - Configuration : Max 100 requêtes / 15min par IP.
- **Strategie de Cache (Cache-Aside Pattern)** :
    - Implémentation d'un Service de Cache (simulant Redis avec `node-cache`).
    - Logique du contrôleur :
      1.  Check Cache (`get`). Si présent -> return immédiat (< 10ms).
      2.  Si absent -> `Promise.all` des services -> Stockage Cache (`set` avec TTL 60s) -> return.
    - Résultat : Réduction drastique de la latence et protection des APIs tierces (Weather/Traffic) contre la surcharge.

---

## 📂 Structure du projet actuelle

```text
src/
├── config/
│   └── env.ts            # Env Vars validées
├── controllers/
│   ├── dashboardController.ts # Logique d'agrégation + Cache Check
│   └── dashboard.schema.ts    # Schéma de validation
├── middlewares/
│   ├── auth.ts           # Sécurité (Token)
│   ├── errorHandler.ts   # Catch-all error handler
│   ├── rateLimiter.ts    # Protection DDoS 🔥 (NEW)
│   └── validate.ts       # Validation générique Zod
├── routes/
│   └── api.ts            # Définition des URL
├── services/             # Appels externes & Internes
│   ├── cacheService.ts   # Gestion Cache In-Memory 🔥 (NEW)
│   ├── eventService.ts
│   ├── trafficService.ts
│   └── weatherService.ts
├── utils/
│   └── AppError.ts       # Classe d'erreur custom
├── app.ts                # Setup Express + Global Middlewares
└── server.ts             # Server start
```

## 🚀 Prochaines Étapes (Roadmap)

1.  **Jour 5 : Tests & Qualité**
    - Tests Unitaires (Jest).
    - Tests d'Intégration (Supertest).

