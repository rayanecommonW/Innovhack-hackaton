# PACT - Document Investisseurs

## Executive Summary

**PACT** est une application mobile de **contrats d'engagement personnel** qui permet aux utilisateurs de s'engager financièrement sur leurs objectifs personnels. Contrairement aux applications de paris, PACT repose sur un principe fondamental : **l'utilisateur contrôle entièrement le résultat** de son engagement par ses propres actions.

**Marché cible** : 15-35 ans, génération qui cherche motivation et accountability
**Modèle économique** : Commission sur les engagements (3-5%)
**Différenciateur clé** : Légal en France (pas de jeu de hasard), social, gamifié

---

## 1. Le Problème

### La crise de la motivation personnelle

- **92% des résolutions du Nouvel An échouent** avant fin janvier
- **80% des abonnements de salle de sport** sont abandonnés après 3 mois
- **Les apps de habit tracking** ont un taux de rétention de seulement 5% à 30 jours

### Pourquoi les solutions actuelles échouent ?

| Solution | Problème |
|----------|----------|
| Apps de tracking (Habitica, Streaks) | Pas de conséquence réelle à l'échec |
| Coachs personnels | Trop cher (50-200€/h) |
| Groupes d'accountability | Difficile à organiser, engagement faible |
| Apps de paris sportifs | Addictives, basées sur le hasard, illégales pour mineurs |

### L'insight PACT

> "Les gens tiennent leurs engagements quand il y a quelque chose en jeu."

Des études comportementales montrent que **la perte potentielle motive 2x plus que le gain potentiel** (aversion à la perte, Kahneman & Tversky).

---

## 2. La Solution PACT

### Concept

PACT transforme les objectifs personnels en **contrats d'engagement financier** entre amis ou avec la communauté.

```
Je m'engage à [OBJECTIF] avant le [DATE].
Je mets [MONTANT]€ en jeu.
Si je réussis → Je récupère mon argent (+ gains potentiels)
Si j'échoue → Je perds mon engagement (redistribué)
```

### Types de Pacts

#### 1. Pact Entre Amis (Duel)
- 2 personnes s'affrontent sur le même objectif
- Le gagnant remporte les deux mises
- Commission PACT : **3%**

**Exemple** : Pierre et Marie se défient de courir 50km ce mois. Chacun met 20€. Le gagnant repart avec 38,80€.

#### 2. Pact de Groupe
- 3+ personnes sur un objectif commun
- Les gagnants se partagent le pot des perdants
- Commission PACT : **3%**

**Exemple** : Un groupe de 5 amis s'engage à méditer 30 jours. Mise : 15€/personne. 3 réussissent, 2 échouent. Les 3 gagnants récupèrent chacun 24,27€.

#### 3. Pact Public (Communauté)
- Ouvert à tous les utilisateurs PACT
- Défis thématiques (sport, productivité, bien-être)
- Commission PACT : **5%**

**Exemple** : Défi "10 000 pas/jour pendant 30 jours". 1000 participants, 25€ chacun. 60% réussissent → ils récupèrent ~39,58€ chacun.

#### 4. Pact Sponsorisé (B2B)
- Défis créés par des marques/entreprises
- Cagnotte financée par le sponsor
- Participants ne risquent rien, gagnent des récompenses

**Exemple** : Nike sponsorise un défi "Marathon Training". 500 finishers gagnent 50€ de bon d'achat.

---

## 3. Comment ça Marche

### Parcours Utilisateur

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CRÉER/REJOINDRE          2. S'ENGAGER                       │
│  ─────────────────           ───────────                        │
│  Choisir un défi             Mettre de l'argent                 │
│  Définir les règles          en jeu (5-500€)                    │
│  Inviter des amis                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. RÉALISER                 4. PROUVER                         │
│  ──────────                  ────────                           │
│  Accomplir l'objectif        Soumettre une preuve :             │
│  pendant la période          • Photo in-app (vérifiée)          │
│  définie                     • Données HealthKit/Google Fit     │
│                              • Validation par les pairs         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. RÉSULTAT                                                    │
│  ────────                                                       │
│  ✓ Réussi → Récupère sa mise + part des perdants                │
│  ✗ Échoué → Perd sa mise (redistribuée aux gagnants)            │
└─────────────────────────────────────────────────────────────────┘
```

### Système de Preuve (Anti-Triche)

PACT utilise un système de vérification multi-niveaux :

| Méthode | Score de confiance | Description |
|---------|-------------------|-------------|
| **API Fitness** | 95/100 | Données HealthKit/Google Fit automatiques |
| **Photo Caméra** | 85-100/100 | Photo prise in-app avec métadonnées |
| **Photo Galerie** | 50-60/100 | Import depuis galerie (moins fiable) |
| **Validation Pairs** | Variable | Les autres participants votent |

#### Métadonnées de vérification photo :
- Timestamp serveur (non modifiable)
- Géolocalisation (optionnelle)
- Hash d'intégrité de l'image
- Délai capture → soumission

---

## 4. Modèle Économique

### Sources de Revenus

#### A. Commission sur les Pacts (Core Business)

| Type de Pact | Commission | Justification |
|--------------|------------|---------------|
| Entre amis / Groupe | **3%** | Taux compétitif pour acquisition |
| Public (communauté) | **5%** | Valeur ajoutée : matching, modération |
| Sponsorisé | **0%** utilisateur | Revenus B2B côté sponsor |

**Exemple de calcul** :
- 10 000 utilisateurs actifs
- 2 pacts/mois/utilisateur en moyenne
- Mise moyenne : 20€
- Volume mensuel : 10 000 × 2 × 20€ = **400 000€**
- Revenus (4% moyen) : **16 000€/mois**

#### B. Pacts Sponsorisés (B2B)

Tarification pour les marques :
- **Setup fee** : 500-2000€ (création du défi)
- **Coût par participant** : 2-5€
- **Cagnotte** : financée par le sponsor

**Cibles B2B** :
- Marques sport/fitness (Nike, Adidas, Decathlon)
- Assurances santé (réduction prime si objectifs atteints)
- Apps concurrentes (cross-promotion)
- Entreprises (bien-être employés)

#### C. PACT Premium (Futur)

Abonnement 4,99€/mois :
- Pas de commission sur les pacts entre amis
- Statistiques avancées
- Badges exclusifs
- Pacts illimités

### Projections Financières (Hypothèses conservatrices)

| Métrique | Année 1 | Année 2 | Année 3 |
|----------|---------|---------|---------|
| Utilisateurs actifs | 10 000 | 50 000 | 200 000 |
| Volume de pacts | 2,4M€ | 15M€ | 72M€ |
| Revenus commissions | 96K€ | 600K€ | 2,9M€ |
| Revenus B2B | 20K€ | 150K€ | 500K€ |
| **Total revenus** | **116K€** | **750K€** | **3,4M€** |

---

## 5. Positionnement Légal

### PACT n'est PAS un jeu de hasard

#### Définition légale du jeu de hasard (Article L. 320-1 CSI)

> "Est un jeu de hasard un jeu payant où le hasard prédomine sur l'habileté et les combinaisons de l'intelligence pour l'obtention du gain."

#### Pourquoi PACT n'entre pas dans cette définition :

| Critère | Jeu de hasard | PACT |
|---------|---------------|------|
| **Contrôle du résultat** | Aucun (dés, cartes, roulette) | **Total** (actions de l'utilisateur) |
| **Rôle du hasard** | Déterminant | **Aucun** |
| **Nature** | Divertissement spéculatif | **Outil de motivation personnelle** |
| **Comparaison** | Casino, PMU, FDJ | Coaching, apps de productivité |

#### Qualification juridique de PACT

PACT est un **contrat d'engagement personnel** (ou "commitment contract"), similaire à :
- Un coach qui garde votre argent si vous n'atteignez pas vos objectifs
- Un pari entre amis sur vos propres actions (légal car basé sur l'habileté personnelle)
- Une caution motivationnelle

#### Références juridiques

1. **StickK** (USA) : Modèle similaire, opère depuis 2008 sans problème légal
2. **Beeminder** (USA) : Engagement financier sur objectifs, jamais qualifié de gambling
3. **Jurisprudence française** : Les paris sur ses propres performances ne sont pas des jeux de hasard

### Conformité Réglementaire

| Réglementation | Statut PACT | Mesures |
|----------------|-------------|---------|
| **Jeux de hasard (ANJ)** | Non concerné | N/A |
| **Services de paiement (ACPR)** | Exempté via Stripe Connect | PACT ne détient jamais les fonds |
| **RGPD** | Conforme | Consentement explicite, DPO désigné |
| **Données de santé** | Conforme Article 9 | Consentement spécifique, minimisation |

### Architecture de paiement (Évite la licence bancaire)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Utilisateur │────▶│   STRIPE    │────▶│  Gagnants   │
│   (dépôt)   │     │  CONNECT    │     │  (payout)   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    PACT ne touche
                    jamais les fonds
                    (sauf commission)
```

**Stripe Connect Custom** permet à PACT de :
- Faciliter les paiements entre utilisateurs
- Prélever sa commission automatiquement
- Ne jamais détenir les fonds des utilisateurs
- Éviter le statut d'établissement de paiement

---

## 6. Marché & Concurrence

### Taille du Marché

| Segment | Taille mondiale | Croissance |
|---------|-----------------|------------|
| Apps de fitness | 14,7 Mds$ (2024) | +14%/an |
| Apps de habit tracking | 2,1 Mds$ | +18%/an |
| Wellness corporate | 61 Mds$ | +7%/an |
| **TAM PACT** | ~5 Mds$ | - |

### Analyse Concurrentielle

| Concurrent | Modèle | Forces | Faiblesses |
|------------|--------|--------|------------|
| **StickK** | Engagement solo | Pionnier, crédibilité | UX datée, pas social |
| **Beeminder** | Tracking + $ | Intégrations API | Complexe, niche geek |
| **Habitica** | Gamification | Fun, communauté | Pas d'enjeu réel |
| **Duolingo** | Streaks | Rétention énorme | Pas financier |
| **PACT** | Social + Argent | **Social, fun, enjeu réel** | Nouveau entrant |

### Avantages Compétitifs PACT

1. **Dimension sociale** : Défier ses amis, pas juste soi-même
2. **Enjeu financier réel** : Motivation par l'aversion à la perte
3. **UX moderne** : Design premium, pas une app "outil"
4. **Vérification robuste** : Anti-triche via APIs fitness + photo vérifiée
5. **Modèle B2B** : Revenus diversifiés via sponsors

---

## 7. Stack Technique

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                    React Native + Expo                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Auth      │  │   Pacts     │  │   Social    │              │
│  │  (Clerk)    │  │  Management │  │   (Chat)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│                    Convex (BaaS)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Real-time  │  │   Actions   │  │  Scheduled  │              │
│  │    Sync     │  │  (mutations)│  │    Jobs     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Stripe  │   │  OpenAI  │   │ HealthKit│
        │ Connect  │   │   (AI)   │   │Google Fit│
        └──────────┘   └──────────┘   └──────────┘
```

### Technologies Clés

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| Mobile | React Native + Expo | Cross-platform, hot reload |
| Backend | Convex | Real-time, serverless, type-safe |
| Auth | Clerk | Social login, sécurisé |
| Paiements | Stripe Connect | Conformité, fiabilité |
| KYC | Stripe Identity | Vérification d'identité |
| Fitness iOS | Apple HealthKit | Données officielles |
| Fitness Android | Google Fit | Données officielles |
| AI Validation | OpenAI GPT-4 | Analyse des preuves photo |
| Storage | Convex Storage | Images des preuves |

### Sécurité

- **Authentification** : OAuth 2.0 via Clerk
- **Paiements** : PCI-DSS via Stripe (PACT ne voit jamais les cartes)
- **Données** : Chiffrement at-rest et in-transit
- **KYC** : Vérification d'identité pour retraits > seuils
- **Anti-fraude** : Hash d'intégrité photos, timestamps serveur

---

## 8. Go-to-Market

### Phase 1 : Lancement (Mois 1-3)

**Cible** : Early adopters, fitness enthusiasts

- Lancement sur App Store / Play Store
- Marketing viral : "Défie tes amis"
- Partenariats micro-influenceurs fitness
- PR : "L'app qui vous fait tenir vos engagements"

**Objectif** : 1 000 utilisateurs actifs

### Phase 2 : Croissance (Mois 4-12)

**Cible** : Grand public 18-35 ans

- Campagnes TikTok/Instagram (UGC)
- Programme de parrainage (5€ offerts)
- Premiers pacts sponsorisés (test B2B)
- Expansion catégories : études, finance perso, créativité

**Objectif** : 10 000 utilisateurs actifs

### Phase 3 : Scale (Année 2+)

- Expansion européenne (UK, Allemagne, Espagne)
- Plateforme B2B self-service pour sponsors
- PACT Premium (abonnement)
- Intégrations : Strava, MyFitnessPal, banques

**Objectif** : 50 000+ utilisateurs actifs

### Canaux d'Acquisition

| Canal | Coût estimé | Potentiel |
|-------|-------------|-----------|
| Viral/Organique | 0€ | Élevé (nature sociale) |
| Influenceurs | 500-2000€/campagne | Moyen |
| Meta Ads | 2-5€/install | Moyen |
| ASO | 0€ | Moyen |
| PR | Variable | Élevé (angle unique) |

---

## 9. Équipe

*[À compléter avec l'équipe réelle]*

### Profils Recherchés

- **CEO/Business** : Exp. startup, levée de fonds
- **CTO** : Mobile + Backend, exp. fintech idéalement
- **CPO/Design** : UX mobile, gamification
- **Growth** : Marketing digital, communauté

---

## 10. Roadmap Produit

### Q1 2025 - MVP
- [x] App mobile iOS/Android
- [x] Pacts entre amis
- [x] Pacts de groupe
- [x] Système de preuve photo
- [x] Intégration Stripe

### Q2 2025 - Social
- [ ] Chat in-app
- [ ] Feed d'activité
- [ ] Notifications push avancées
- [ ] Pacts publics

### Q3 2025 - Scale
- [ ] Pacts sponsorisés (B2B)
- [ ] PACT Premium
- [ ] Intégrations tierces (Strava, etc.)
- [ ] Analytics avancées

### Q4 2025 - International
- [ ] Localisation UK/DE/ES
- [ ] Expansion équipe
- [ ] Partenariats majeurs

---

## 11. Métriques Clés (KPIs)

| Métrique | Description | Cible M6 |
|----------|-------------|----------|
| **MAU** | Utilisateurs actifs mensuels | 5 000 |
| **Pacts/user/mois** | Engagement | 2+ |
| **Taux de complétion** | % pacts réussis | 60-70% |
| **Rétention M1** | Retour après 30j | 40%+ |
| **NPS** | Satisfaction | 50+ |
| **Volume transactionnel** | €/mois | 100K€ |
| **Take rate** | Commission effective | 4% |

---

## 12. Demande de Financement

### Seed Round

**Montant recherché** : 300 000 - 500 000€

### Utilisation des Fonds

| Poste | % | Montant |
|-------|---|---------|
| Produit & Tech | 50% | 150-250K€ |
| Marketing & Growth | 30% | 90-150K€ |
| Opérations & Legal | 15% | 45-75K€ |
| Buffer | 5% | 15-25K€ |

### Milestones

Avec ce financement, nous atteindrons :

1. **10 000 MAU** en 12 mois
2. **Profitabilité unitaire** (LTV > CAC)
3. **Product-Market Fit** validé (NPS > 50)
4. **Premiers revenus B2B** (3+ sponsors)
5. **Préparation Série A**

---

## 13. Pourquoi Investir dans PACT ?

### 1. Timing Parfait
- Génération qui cherche accountability et motivation
- Post-COVID : focus sur le bien-être personnel
- Fatigue des apps de tracking sans enjeu

### 2. Modèle Vertueux
- L'utilisateur VEUT perdre de l'argent s'il échoue
- Pas de dark patterns, pas d'addiction malsaine
- Alignement utilisateur / business

### 3. Viralité Native
- Défier ses amis = acquisition organique
- Chaque pact = potentiellement nouveaux users
- Social proof puissant

### 4. Barrières à l'Entrée
- Effet réseau (plus d'users = plus de pacts possibles)
- Intégrations techniques (HealthKit, Stripe, etc.)
- Positionnement légal validé

### 5. Potentiel B2B
- Marques prêtes à payer pour l'engagement
- Assurances intéressées par la prévention
- Entreprises pour le wellness

---

## Contact

**PACT**
[Email]
[Site web]
[LinkedIn]

---

*Document confidentiel - Ne pas diffuser sans autorisation*
*Dernière mise à jour : Janvier 2025*
