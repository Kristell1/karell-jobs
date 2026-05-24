# Studio Candidature 🎯

Plateforme IA pour la recherche d'emploi UX/Product Designer.
Recherche d'offres en temps réel, génération de titres CV optimisés, et rédaction de candidatures personnalisées.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fonctionnalités

- 🔍 **Recherche d'offres** — Web search en temps réel via Claude avec critères personnalisés
- 📝 **Titre CV** — Génération de 4 titres optimisés, copiables dans Canva en un clic
- ✉️ **Candidature** — Rédaction d'emails sur-mesure, ouverture directe dans Gmail
- 🚦 **Rate limiting** — 5 recherches par IP par jour, plafond strict via Upstash Redis
- 🔑 **Bring Your Own Key (BYOK)** — Les power users peuvent utiliser leur propre clé pour bypasser les limites

## 🚀 Démarrage rapide (local)

```bash
npm install
cp .env.example .env.local
# → Renseigne tes clés dans .env.local
npm run dev
```

L'app tourne sur `http://localhost:3000`. Sans Upstash configuré, le rate limiting est désactivé (pratique en dev).

## 🌍 Déploiement public via Vercel (gratuit)

### 1. Cloner et pousser sur GitHub

```bash
cd karell-jobs
git init
git add .
git commit -m "Initial commit"
```

Sur [github.com/new](https://github.com/new), crée un repo public `karell-jobs`, puis :

```bash
git remote add origin https://github.com/TON-USERNAME/karell-jobs.git
git branch -M main
git push -u origin main
```

### 2. Clé Anthropic

1. Compte sur [console.anthropic.com](https://console.anthropic.com)
2. Ajoute du crédit (5-10 $ suffisent)
3. **Important** : dans **Settings → Limits**, fixe un plafond mensuel strict (ex. 25 $) — sécurité absolue
4. Dans **API Keys**, crée une clé `sk-ant-…`

### 3. Upstash Redis (rate limiting, gratuit)

1. Crée un compte sur [upstash.com](https://upstash.com) (gratuit, login Google/GitHub)
2. **Create Database** → région **eu-west** → name : `karell-jobs`
3. Onglet **REST API** → copie `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`

Free tier : 10 000 requêtes/jour, largement suffisant.

### 4. Déployer sur Vercel

1. [vercel.com](https://vercel.com) → connecte ton GitHub
2. **Add New → Project** → importe `karell-jobs`
3. Dans **Environment Variables**, ajoute :
   - `ANTHROPIC_API_KEY` = ta clé Anthropic
   - `UPSTASH_REDIS_REST_URL` = ton URL Upstash
   - `UPSTASH_REDIS_REST_TOKEN` = ton token Upstash
   - (optionnel) `MAX_SEARCHES_PER_IP_PER_DAY` = `5` (défaut)
4. **Deploy**

⏱️ ~2 minutes plus tard : `https://karell-jobs.vercel.app`

## 💰 Estimation des coûts

Avec Claude Sonnet 4.6 (3 $/M input, 15 $/M output) + web search (10 $/1000 recherches) :

| Action | Coût |
|--------|------|
| Recherche d'offres | ~0,08-0,12 $ |
| Génération de titres CV | ~0,003 $ |
| Rédaction d'email | ~0,007 $ |

Avec le cap à 5 recherches/IP/jour : **max 0,55 $/IP/jour**.

**Scénarios mensuels réalistes :**

- Quelques recruteurs (5 visiteurs/jour) : ~5-15 $/mois
- Partage actif (25/jour) : ~30-80 $/mois
- Article viral (200/jour) : ~250-700 $/mois

Le plafond Anthropic Console te protège contre le dépassement.

## 🔐 Sécurité de la clé API

- La clé Anthropic du serveur (`ANTHROPIC_API_KEY`) reste côté serveur, jamais exposée au navigateur
- Si un utilisateur active **BYOK** (Bring Your Own Key), sa clé est stockée dans son navigateur (`localStorage`) et transmise au serveur uniquement pour relayer la requête à Anthropic — jamais loguée

## 📐 Personnalisation

### Adapter ton profil par défaut

Dans `app/page.jsx`, modifie l'état `profile.pitch` pour ton pitch par défaut. Les utilisateurs peuvent l'éditer dans l'UI section "Profil candidat".

### Changer les couleurs

Tous les tokens design sont dans `app/globals.css` :

```css
:root {
  --accent: #b6ff5f;   /* couleur d'accent */
  --bg: #08080a;       /* fond */
  --mono: 'DM Mono';   /* font monospace */
  --sans: 'Syne';      /* font display */
}
```

### Changer le cap journalier

Variable d'env `MAX_SEARCHES_PER_IP_PER_DAY` dans Vercel (défaut : 5).

### Changer les sources d'offres

Par défaut, la recherche est restreinte à **LinkedIn, HelloWork et Indeed** via le paramètre `allowed_domains` du tool web_search d'Anthropic. Pour modifier cette liste, édite la constante `JOB_SOURCES` dans `app/api/anthropic/route.js` :

```js
const JOB_SOURCES = [
  "linkedin.com",
  "hellowork.com",
  "indeed.fr",
  "indeed.com",
  "welcometothejungle.com", // ajoute ce que tu veux
];
```

Les sous-domaines sont inclus automatiquement (ex. `linkedin.com` couvre `fr.linkedin.com`, `jobs.linkedin.com`, etc.).

## 📁 Structure

```
karell-jobs/
├── app/
│   ├── api/anthropic/route.js   # Proxy Anthropic + rate limit + BYOK
│   ├── layout.jsx               # Layout + fonts
│   ├── page.jsx                 # App principale
│   └── globals.css              # Design tokens
├── components/
│   ├── ui.jsx                   # Btn, Input, Textarea, Spinner
│   ├── JobCard.jsx              # Carte d'offre
│   └── Settings.jsx             # Modal BYOK + quota
├── lib/
│   └── ratelimit.js             # Wrapper Upstash
└── .env.example
```

## 🛠️ Stack

- **Next.js 15** (App Router, Edge runtime) — framework React
- **React 19**
- **Claude Sonnet 4.6** via API Anthropic — avec `web_search` natif
- **Upstash Redis** — rate limiting per-IP (free tier)
- **Vercel** — hébergement serverless gratuit

## 📄 Licence

MIT — fais-en ce que tu veux.

---

Conçu par Karell · UX/Product Designer
