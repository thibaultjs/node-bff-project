# Guide d'Entretien Technique - Node.js Confirmé / BFF

Ce document compile les questions techniques les plus probables pour un poste de développeur Node.js Backend For Frontend (BFF), avec les réponses attendues pour démontrer un niveau "Senior".

---

## 🟢 Axe 1 : Le "Moteur" Node.js (Interne & Performance)

### Q1: "Explique-moi le fonctionnement de l'Event Loop. Comment Node.js gère 10k requêtes s'il est Single-Threaded ?"

**La Réponse Senior** :
"Node.js utilise un seul thread principal pour exécuter le code JavaScript (Stack V8).
Cependant, il délègue toutes les opérations bloquantes (I/O, Réseau, Lecture fichier) au noyau du système (via `libuv` qui gère un pool de threads C++).
Une fois la tâche finie, le système place le résultat dans une file d'attente (Callback Queue). L'Event Loop ne fait que tourner : si la Stack est vide, elle prend le prochain message de la file.
C'est le modèle **Non-Blocking I/O**. C'est pour ça qu'on utilise `Promise.all` dans notre BFF : pour lancer les tâches en parallèle."

> **💡 Complément Expert (Libuv) :**
> Si on veut creuser, Node utilise **Libuv**. Pour le réseau (HTTP), Libuv utilise les notifications de l'OS (epoll sur Linux, kqueue sur Mac) donc c'est _vraiment_ non-bloquant et sans thread supplémentaire. Par contre, pour le FileSystem (fs) et la Crypto, Libuv utilise un **Thread Pool** interne (par défaut 4 threads), car les OS n'ont pas de vraie lecture de fichier asynchrone parfaite.

### Q2: "Quelle est la différence entre `process.nextTick` et `setImmediate` ?"

**La Réponse Senior** :
"C'est une question de priorité dans l'Event Loop :

- `process.nextTick` s'exécute **immédiatement après** l'opération courante, avant que l'Event Loop ne continue. (Priorité Max).
- `setImmediate` est exécuté lors de la phase 'Check' du prochain cycle de l'Event Loop (après les I/O)."
  > **💡 Complément Expert (Priorité & Danger) :**
  > L'ordre théorique est :
  >
  > 1. Code Synchrone (Stack)
  > 2. `process.nextTick` (Prio Absolue, danger de boucle infinie !)
  > 3. Microtasks (`Promise.then`)
  > 4. Event Loop Phases (Timers -> Poll -> Check...).
  >    En pratique, `nextTick` sert à "couper la file d'attente" pour émettre un événement ou gérer une erreur _avant_ que les I/O ne continuent.

### Q3: "On doit uploader une vidéo de 2Go. Comment tu gères ça sans crasher la RAM ?"

**Le Piège** : "Je lis le fichier avec `fs.readFile`". (Saturation RAM instantanée).
**La Réponse Senior** :
"J'utilise les **Streams**. Je lis le fichier entrant (`req` est un stream) et je le 'pipe' vers la destination (`req.pipe(destinationStream)`). La mémoire utilisée reste constante (quelques KB), peu importe la taille du fichier. Node est excellent pour ça."

> **💡 Complément Expert (Backpressure) :**
> Le mot-clé à placer est la **Backpressure**. Si le disque écrit moins vite que le réseau n'envoie de données, le buffer RAM pourrait exploser. Le mécanisme de `pipe()` gère ça automatiquement : il met en pause le stream de lecture (`readable.pause()`) tant que le stream d'écriture est plein, et reprend (`readable.resume()`) quand le buffer se vide (`drain` event). C'est la gestion de flux hydraulique appliquée au code.

### Q4: "Comment utiliser les 16 cœurs CPU d'un serveur de prod ?"

**La Réponse Senior** :
"Nativement, Node n'utilise qu'un cœur. Pour le scaling vertical, j'utilise le module **Cluster** (ou PM2 en mode cluster).
Ça lance N instances de l'application qui partagent le même port TCP. Si un worker crashe, le master le redémarre."

> **💡 Complément Expert (Zero Downtime) :**
> En production, cela permet le **Zero Downtime Reload**. Quand on déploie une nouvelle version, PM2 tue les workers un par un et les remplace par la nouvelle version. Il y a toujours des workers actifs pour répondre aux clients pendant la mise à jour.

---

## 🔵 Axe 2 : Architecture & Qualité de Code

### Q5: "Comment gères-tu les erreurs dans une grosse app Express ?"

**La Réponse Senior** :
"Je centralise tout. (Pas de `try/catch` avec `res.status(500)` partout).

1.  Une classe `AppError` (message + statusCode).
2.  Un Middleware global `errorHandler` en fin de chaîne.
3.  Dans les controlleurs, je passe l'erreur au middleware (`next(err)`). Ça garantit des réponses d'erreurs uniformes pour le front."

> **💡 Complément Expert (Async Wrapper) :**
> L'astuce ultime pour éviter les `try/catch` répétitifs est d'utiliser un **Async Wrapper** (Higher-Order Function).
> C'est une fonction qui prend mon controller `fn` et retourne `(req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`.
> Ainsi, toute Promise rejetée dans le code métier est automatiquement passée à `next()` sans rien écrire.

### Q6: "Pourquoi séparer `server.ts` et `app.ts` ?"

**La Réponse Senior** :
"Pour la testabilité. `app` contient la logique Express, `server` gère le réseau. Ça permet de tester `app` avec supertest sans lancer de serveur HTTP réel."

> **💡 Complément Expert (Graceful Shutdown) :**
> Séparer le serveur permet aussi de gérer proprement le **Graceful Shutdown**.
> Quand Kubernetes envoie un `SIGTERM` pour tuer le pod, on peut appeler `server.close()` dans `server.ts` : cela arrête d'accepter de nouvelles connexions mais laisse les requêtes en cours se terminer proprement. C'est vital pour ne pas couper un utilisateur en plein paiement.

### Q7: "Dependency Injection : Utile en Node ?"

**La Réponse Senior** :
"Oui, indispensable pour les tests unitaires.
Au lieu d'importer la vraie DB dans mon Service, je l'injecte. Comme ça, dans mes tests, je peux injecter une 'Mock DB' facilement."

> **💡 Complément Expert (Hexagonal Architecture) :**
> Cela touche aux principes de l'**Architecture Hexagonale (Ports & Adapters)**.
> Mon code métier (Domaine) définit une interface `UserRepository` (le Port).
> En prod, j'injecte l'adaptateur `PostgresUserRepo`. En test, j'injecte `InMemoryUserRepo`.
> Le métier ne dépend jamais de la technologie de base de données.

---

## 🟠 Axe 3 : Le BFF (Backend For Frontend) & Résilience

### Q8: "Quel est l'intérêt principal d'un BFF Mobile ?"

**La Réponse Senior** :

1.  **Réduction Latence** : Le mobile fait 1 appel (lent) au lieu de 3. Le serveur fait les 3 appels internes (rapides) en parallèle.
2.  **Data Minimization** : On filtre les champs inutiles pour économiser la 4G de l'utilisateur.
3.  **Sécurité** : Les tokens API des services tiers restent cachés sur le serveur.

> **💡 Complément Expert (Pattern Sam Newman) :**
> Attention, le pattern BFF tel que défini par **Sam Newman** implique **"One BFF per User Experience"**.
> Si on a une App Web Desktop complexe et une App IOS, on devrait théoriquement avoir deux BFFs distincts.
> Si on utilise le même backend pour tout le monde, on retombe vers une API Gateway générique, et on perd la spécialisation (le "F" de BFF).

### Q9: "Le service Météo est en panne (Timeout). Que se passe-t-il dans ton BFF ?"

**Le Danger** : Les requêtes s'empilent, la mémoire sature, le BFF crashe pour tout le monde (Cascading Failure).
**La Réponse Senior** :
"J'implémente un **Circuit Breaker** (ex: Opossum).
Si le service Météo échoue X fois, le circuit s'ouvre : le BFF n'essaie même plus d'appeler le service pendant 30s et renvoie une réponse par défaut (ou une erreur gérée) immédiatement. Ça protège mon système."

> **💡 Complément Expert (Les 3 états) :**
> Le Circuit Breaker a 3 états :
>
> - **CLOSED** : Tout va bien, les requêtes passent.
> - **OPEN** : Trop d'échecs. Le circuit est coupé. Fast Fail.
> - **HALF-OPEN** : Après un délai (ex: 30s), on laisse passer **1 seule requête test**. Si elle réussit, on repasse en CLOSED. Sinon, on retourne en OPEN.

### Q10: "GraphQL vs REST pour ce poste ?"

**La Réponse Senior** :
"**REST** : Simple, robuste, cache HTTP facile. Bien si les écrans mobiles sont stables.
**GraphQL** : Puissant si l'UI change tout le temps. Permet au mobile de demander exactement ce qu'il veut (pas d'Over-fetching).
Sur ce projet, on est partis sur REST pour la simplicité, mais GraphQL serait une évolution logique si les besoins UI se complexifient."

> **💡 Complément Expert (HTTP Caching) :**
> Le vrai problème de GraphQL est le **Caching HTTP**.
> Avec REST `GET /events/1`, le navigateur ou un CDN (Cloudflare) peut mettre en cache la réponse (Header `Cache-Control`).
> Avec GraphQL, tout passe souvent par `POST /graphql`. Les CDN ne cachent pas les POST. Il faut donc gérer le cache côté client (Apollo Client) ou faire des requêtes Persisted Queries (GET). C'est plus complexe.

---

## 🟣 Axe 4 : Sécurité & Ops (Production)

### Q11: "Les failles de sécurité courantes en Node ?" (OWASP)

1.  **ReDoS** (Regex Denial of Service) : Une regex mal faite bloque l'Event Loop. -> _Utiliser des librairies de validation._
2.  **NoSQL Injection** : Envoyer `{"$gt": ""}` dans un login Mongo. -> _Sanitizer les inputs ($)._
3.  **Prototype Pollution** : Modifier `Object.prototype` via un JSON malicieux. -> _Utiliser des validateurs de schema (Zod)._
    > **💡 Complément Expert (Prototype Pollution) :**
    > Si un attaquant envoie `{"__proto__": {"isAdmin": true}}` et que tu merges cet objet sans protection, TOUS les objets de ton application héritent soudainement de la propriété `isAdmin = true`. C'est une faille critique en JS. La solution la plus radicale est d'utiliser `Object.create(null)` ou des `Map` qui n'ont pas de prototype, ou de geler les prototypes natifs avec `Object.freeze(Object.prototype)`.

### Q12: "JWT vs Session Cookies ?"

**La Réponse Senior** :
"JWT est Stateless (infos dans le token), donc ça scale à l'infini facilement. C'est le standard pour les API Mobiles.
Les Cookies de Session sont Stateful (infos en DB/Redis) et plus faciles à révoquer (logout forcé), mais nécessitent un store partagé."

> **💡 Complément Expert (Révocation JWT) :**
> Le défaut du JWT est qu'on ne peut pas le tuer avant son expiration.
> Si on doit bannir un utilisateur, il faut stocker son JWT dans une "Blacklist" (souvent une clé Redis avec un TTL).
> Du coup, on réintroduit un appel DB à chaque requête... ce qui annule l'avantage "Stateless" du JWT. C'est le compromis à connaître.

### Q13: "Qu'est-ce que tu vérifies en premier pour sécuriser Express ?"

**La Réponse Senior** :
"J'installe **Helmet** (headers de sécurité), je mets du **Rate Limiting** (contre le bruteforce), je valide TOUTES les entrées avec **Zod/Joi**, et je configure **CORS** strictement."

> **💡 Complément Expert (Supply Chain Attacks) :**
> Le code peut être parfait, si les dépendances sont vérolées, c'est fini.
> Le plus gros risque actuel en Node est la **Supply Chain Attack**.
> Il faut impérativement automatiser `npm audit` dans la CI/CD et utiliser des outils comme Snyk ou Dependabot. Une lib obscure mise à jour par un hacker peut voler toutes les variables d'environnement (`ENV`).

---

## 💡 Joker : Ton avantage "Frontend Expert"

### Q14: "En quoi ton passif React aide en Backend ?"

**La Réponse 5 étoiles** :
"Je ne construis pas juste une API qui 'marche techniquement'. Je construis l'API que j'aurais rêvé consommer.
Je sais qu'un Front a besoin de :

1.  Types clairs (TypeScript partagé si possible).
2.  Des erreurs précises (pas juste 'Error 500').
3.  Des données prêtes à afficher (pas de calcul de date complexe coté client).
    Mon BFF est un service rendu à l'équipe Mobile."

> **💡 Complément Expert (Server-Driven UI) :**
> Le niveau ultime, c'est le **Server-Driven UI (SDUI)**.
> Au lieu d'envoyer juste des données (`{ title: 'Promo' }`), le BFF envoie la structure de l'écran (`{ type: 'BannerComponent', props: { text: ... } }`).
> De grandes apps comme Airbnb, Uber ou Spotify utilisent ça : cela permet de changer l'UI de l'app native instantanément (modifier l'ordre des sections, ajouter une bannière) sans attendre la validation de l'Apple Store.

---

## 🧪 Axe 5 : Testing & Quality Assurance

### Q15: "Pourquoi tester un contrôleur si mes services sont déjà testés ?"

**La Réponse Senior** :
"Les Tests Unitaires de services valident la logique unitaire.
Les Tests d'Intégration (Controller) valident l'orchestration et le **Contrat d'Interface**.
Je dois m'assurer que si mon Service renvoie une donnée, mon Controller la formate correctement en JSON, renvoie le bon Status Code HTTP (200 vs 500) et gère les erreurs proprement."

### Q16: "Comment testes-tu sans lancer de vraie base de données ou de vrais appels HTTP ?"

**La Réponse Senior** :
"J'utilise le **Mocking** (avec `jest.mock`).
Je remplace les dépendances externes (Service Météo, DB) par des faux objets que je contrôle.
Cela rend mes tests :
1. **Deterministes** : Ça ne plante pas si le réseau coupe.
2. **Rapides** : Pas de latence réseau.
3. **Isolés** : Je teste mon code, pas celui de la météo."

> **💡 Complément Expert (Test Doubles) :**
> Il faut distinguer :
> *   **Stub** : Renvoie une donnée fixe pré-programmée ("Si on t'appelle, réponds 'Sunny'").
> *   **Spy** : Espionne une fonction ("Est-ce qu'elle a bien été appelée avec 'Paris' ?").
> *   **Mock** : Un objet complet simulant le comportement attendu.

### Q17: "Pyramide de tests : Quelle est ta stratégie ?"

**La Réponse Senior** :
"Je suis la pyramide classique :
1. **Unit Tests (70%)** : Sur les algos complexes et les utilitaires. Rapides (<1ms).
2. **Integration Tests (20%)** : Sur les Controllers API (avec mocks DB/Services). Valident le flux HTTP.
3. **E2E Tests (10%)** : Sur les parcours critiques (Login -> Dashboard), avec une vraie DB de test (Docker). Plus lents mais vitaux."
